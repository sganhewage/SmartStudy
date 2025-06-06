import pdfplumber
from fpdf import FPDF

import torch

import pytesseract
from PIL import Image
import speech_recognition as sr

import threading
from transformers import TextIteratorStreamer
from contextlib import suppress

from modelCache import load_pipeline

try:
    from tqdm import tqdm          # nice progress bars
except ImportError:                # fallback if user doesn’t install tqdm
    tqdm = None

def progress_iter(it, desc):
    """
    Wrap an iterable with tqdm if available, else plain iterator with a print.
    """
    if tqdm:
        return tqdm(it, desc=desc)
    else:
        print(desc + " …")
        return it                  # plain iterator (no bar)

summarizer = load_pipeline("summarization",
        "sshleifer/distilbart-cnn-6-6",
    )

generator  = load_pipeline("text-generation",
        #"tiiuae/falcon-rw-1b", #default
        "EleutherAI/gpt-neo-125M",   # testing
    )


def extract_text_from_pdf(file_path: str) -> str:
    with pdfplumber.open(file_path) as pdf:
        pages = progress_iter(pdf.pages, desc="📄 Extracting PDF pages")
        return "\n".join(p.extract_text() or "" for p in pages)

def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image using OCR."""
    img = Image.open(file_path)
    return pytesseract.image_to_string(img)

def extract_text_from_audio(file_path: str) -> str:
    """Transcribe speech from an audio file."""
    recognizer = sr.Recognizer()
    with sr.AudioFile(file_path) as source:
        audio = recognizer.record(source)
    # type: ignore is used to suppress IDE type checking errors for recognize_google
    return recognizer.recognize_google(audio)  # type: ignore

def extract_text_by_type(file_path: str, content_type: str) -> str:
    """Smart dispatcher that chooses the correct extractor based on MIME type."""
    if content_type == "application/pdf":
        return extract_text_from_pdf(file_path)
    elif content_type.startswith("image/"):
        return extract_text_from_image(file_path)
    elif content_type.startswith("audio/"):
        return extract_text_from_audio(file_path)
    else:
        raise ValueError(f"Unsupported content type: {content_type}")


GENERATOR_LIMIT   = generator.model.config.max_position_embeddings   # 2048
SAFETY_MARGIN     = 150       # reserve tokens for the answer itself
MAX_INPUT_TOKENS  = GENERATOR_LIMIT - SAFETY_MARGIN                 # 1898
SUMMARISE_CHUNK   = 800       # slice for distilBART
PARTIAL_SUM_TOK   = 200       # each partial summary target length


# ---------------------------------------------------------------------
#  Helper: compress if needed
# ---------------------------------------------------------------------
from typing import List

def _compress_if_needed(text: str) -> str:
    tok      = generator.tokenizer
    total_tk = len(tok(text)["input_ids"])
    if total_tk <= MAX_INPUT_TOKENS:
        print(f"✅ Context fits ({total_tk} tokens), no compression.")
        return text

    print(f"🔻 Compressing {total_tk} tokens → summaries …")

    # slice & summarise with progress bar
    ids = summarizer.tokenizer(text)["input_ids"]
    chunks = [ids[i : i + SUMMARISE_CHUNK]
              for i in range(0, len(ids), SUMMARISE_CHUNK)]

    partials: list[str] = []
    for idx_ids in progress_iter(range(len(chunks)), desc="✂️  Summarising"):
        decoded = summarizer.tokenizer.decode(
            chunks[idx_ids], skip_special_tokens=True,
            clean_up_tokenization_spaces=True
        )
        part = summarizer(decoded, max_length=PARTIAL_SUM_TOK,
                          min_length=60, do_sample=False)[0]["summary_text"]
        partials.append(part)

    comp_len = len(tok(" ".join(partials))["input_ids"])
    print(f"✅ Compressed to {comp_len} tokens.")
    return " ".join(partials)

def generate_with_progress(prompt: str,
                           *,
                           max_new_tokens: int = 350,
                           **gen_kwargs) -> str:
    """
    Stream tokens from `generator` while updating a tqdm bar.
    Works on CPU, CUDA, or Apple‑Silicon MPS.
    """
    # 1) set up streamer
    streamer = TextIteratorStreamer(
        generator.tokenizer,
        skip_prompt=True,           # don't resend the prompt tokens
        skip_special_tokens=True,
    )

    # 2) kick off generation in a background thread
    def _worker():
        generator.model.generate(
            **generator.tokenizer(prompt, return_tensors="pt").to(generator.device),
            streamer=streamer,
            max_new_tokens=max_new_tokens,
            **gen_kwargs,
        )

    thread = threading.Thread(target=_worker)
    thread.start()

    # 3) consume tokens as they arrive
    bar = None
    if tqdm:
        bar = tqdm(total=max_new_tokens, desc="📝 Generating", leave=False)

    collected = []
    for token in streamer:
        collected.append(token)
        if bar:
            bar.update(1)

    if bar:
        bar.close()
    thread.join()

    return "".join(collected).strip()


def single_query_answer(query: str, context: str) -> str:
    """
    • `document_text`  - full extracted PDF / OCR text
    • `system_prompt`  - your preset context + question, e.g.
        "You are an exam expert. In one paragraph, explain …"

    Returns the model's single, well-developed answer.
    """
    context = _compress_if_needed(context)        # compress iff too long
    full_prompt = f"{context}\n\nQuestion: {query}\nAnswer:"
    print("🤖 Generating final answer … (may take a moment)")
    
    
    MODEL_LIMIT = generator.model.config.max_position_embeddings   # 2048
    prompt_tokens   = len(generator.tokenizer(full_prompt)["input_ids"])
    budget = MODEL_LIMIT - prompt_tokens
    max_answer = max(budget - 20, 50)  # never let it go below 50
    response = generate_with_progress(full_prompt, max_new_tokens=max_answer, do_sample=False, no_repeat_ngram_size=3)
    print("✅ Answer generated.")
    # strip the prompt portion to keep only the generated answer
    return response


def generate_summary(
    text: str,
    *,
    max_in_tokens: int = 600,     # 600 + BOS/EOS  ≪ 1024
    max_out_tokens: int = 250,    # length of each partial summary
) -> str:
    """
    Summarise arbitrarily long text by:
      1. tokenising once,
      2. slicing to ≤ `max_in_tokens`,
      3. feeding those IDs straight into model.generate().
    This bypasses any re-tokenisation, so the 1024-token overflow
    warning can never occur.
    """
    model      = summarizer.model
    tokenizer  = summarizer.tokenizer
    device     = next(model.parameters()).device          # cpu / cuda / mps

    # 1) encode entire document (no special tokens)
    full_ids: list[int] = tokenizer.encode(
        text,
        add_special_tokens=False
    )

    # 2) slice safely
    slices: list[list[int]] = [
        full_ids[i : i + max_in_tokens]
        for i in range(0, len(full_ids), max_in_tokens)
    ]

    partials: list[str] = []
    limit = model.config.max_position_embeddings          # 1024 for distilBART

    for ids in slices:
        ids = ids[: limit - 2]                            # final clamp (safety)

        # add batch dim & send to the right device
        input_ids = torch.tensor([ids], dtype=torch.long, device=device)

        with torch.no_grad():
            out_ids = model.generate(
                input_ids,
                max_length=max_out_tokens,
                min_length=60,
                no_repeat_ngram_size=3,
                do_sample=False,
            )[0]

        partials.append(
            tokenizer.decode(
                out_ids,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=True,
            )
        )

    if not partials:
        raise RuntimeError("All chunks failed to summarise")

    return "\n\n".join(partials)



def save_to_pdf(text: str, output_path: str) -> None:
    """Save text to a nicely formatted PDF."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    for line in text.split("\n"):
        pdf.multi_cell(0, 10, line)
    pdf.output(output_path)