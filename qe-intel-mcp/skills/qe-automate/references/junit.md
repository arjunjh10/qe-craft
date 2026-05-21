# JUnit 5 / Mockito

Apply [../SKILL.md](../SKILL.md) — this file is syntax and project conventions only.

## Structure

```java
@DisplayName("calculateDiscount returns 0 when cart total is below minimum threshold")
@Test
void returnsZeroWhenBelowMinimum() {
    assertEquals(0, calculateDiscount(cartWithTotal(500), minimum(1000)));
}
```

- Use `@DisplayName` for readable failure output.
- `@BeforeEach` resets mocks and test doubles.

## Assertions

- Prefer `assertEquals(expected, actual)` with known `expected`.
- Exceptions: `assertThrows(DuplicateEmailException.class, () -> service.create(dup))`.

## Mockito

```java
when(db.findUser(1)).thenReturn(new User(1, "a@b.com"));
var result = userService.getUser(1);
assertEquals("a@b.com", result.getEmail());
verify(emailSender).send(argThat(m -> m.getTemplateId().equals("onboarding-v2")));
```

- Mock **dependencies**, never the class under test.
- Use `verify` with argument matchers when the call contract matters.

## Kotlin

- Same rules; use `kotlin.test` or JUnit 5 with `assertEquals`.
- Prefer `shouldThrow<DuplicateEmailException>` (kotest) or `assertThrows` with clear messages.
