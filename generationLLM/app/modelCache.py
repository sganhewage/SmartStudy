from pathlib import Path
from transformers import pipeline, Pipeline
from huggingface_hub import snapshot_download

PROJECT_CACHE_ROOT = Path(__file__).resolve().parent / ".models"

def load_pipeline(task: str, model_id: str, *,
                  local_subdir: str | None = None,
                  device: int | str | None = None) -> Pipeline:
    """
    Download once into models/<subdir>; return ready pipeline.
    """
    local_dir = PROJECT_CACHE_ROOT / (local_subdir or model_id.replace("/", "--"))
    if not local_dir.exists():
        snapshot_download(repo_id=model_id,
                          local_dir=local_dir,
                          local_dir_use_symlinks=False)
    return pipeline(task,
                    model=str(local_dir),
                    tokenizer=str(local_dir),
                    device=device)