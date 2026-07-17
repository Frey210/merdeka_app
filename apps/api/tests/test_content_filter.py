from app.services.content_filter import contains_profanity, normalize_for_filter


def test_filter_detects_case_repetition_and_common_substitution() -> None:
    assert contains_profanity("ANJIIING")
    assert contains_profanity("g0bl0k")
    assert contains_profanity("b@ngs@t")
    assert contains_profanity("a.n.j.i.n.g")


def test_filter_uses_whole_tokens_to_avoid_false_positive() -> None:
    assert not contains_profanity("Pasukan Indonesia semakin maju")
    assert normalize_for_filter("Makassar!") == ["makasar"]
