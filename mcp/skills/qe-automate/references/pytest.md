# pytest

Apply [../SKILL.md](../SKILL.md) — this file is syntax and project conventions only.

## Structure

```python
def test_calculate_discount_returns_zero_when_below_minimum():
    assert calculate_discount(total_cents=500, min_cents=1000) == 0
```

- Function names: `test_<unit>_<expected>_<condition>`.
- One logical assertion focus per test; use `pytest.raises` for exceptions.

## Fixtures

```python
@pytest.fixture
def cart_below_minimum():
    return Cart(total_cents=500, min_cents=1000)
```

- Fixtures supply **known** inputs; expected values still come from domain knowledge, not from calling the implementation first.
- Scope fixtures narrowly; avoid session-scoped mutable state.

## Mocking

```python
from unittest.mock import patch

@patch("myapp.email.send")
def test_welcome_email_uses_onboarding_template(mock_send, user):
    create_user(user)
    mock_send.assert_called_once_with(
        to="user@example.com", subject="Welcome", template_id="onboarding-v2"
    )
```

- Patch at the **import site** used by the module under test (`where it's looked up`).
- Use `pytest.raises(ValueError, match="...")` instead of try/except in tests.

## Parametrize

Use `@pytest.mark.parametrize` for boundary tables — each row must have an independently known expected value.
