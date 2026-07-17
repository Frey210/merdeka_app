import re
import unicodedata

BLOCKED_WORDS = frozenset(
    {
        "anjing",
        "anjir",
        "anjrit",
        "asu",
        "babi",
        "bajingan",
        "bangsat",
        "brengsek",
        "cuk",
        "goblok",
        "jancuk",
        "kampret",
        "keparat",
        "kontol",
        "memek",
        "ngentot",
        "sundala",
        "tai",
        "tolol",
    }
)

LEET_TRANSLATION = str.maketrans(
    {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "8": "b",
        "@": "a",
        "$": "s",
    }
)


def normalize_for_filter(value: str) -> list[str]:
    normalized = unicodedata.normalize("NFKC", value).casefold().translate(LEET_TRANSLATION)
    normalized = re.sub(r"(.)\1+", r"\1", normalized)
    raw_tokens = re.findall(r"[a-z]+", normalized)
    tokens = list(raw_tokens)
    single_character_run: list[str] = []
    for token in (*raw_tokens, "separator"):
        if len(token) == 1:
            single_character_run.append(token)
        elif single_character_run:
            tokens.append("".join(single_character_run))
            single_character_run.clear()
    return tokens


def contains_profanity(*values: str) -> bool:
    return any(token in BLOCKED_WORDS for value in values for token in normalize_for_filter(value))
