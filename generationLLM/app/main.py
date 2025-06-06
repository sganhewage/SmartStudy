from llmUtils import extract_text_from_pdf, generate_summary, save_to_pdf, single_query_answer

long_text = extract_text_from_pdf("full_exam_answer_key_numbered.pdf")
summary   = single_query_answer(
    query="What is the main topic of this document?",
    context=long_text
)
print("Summary:", summary)