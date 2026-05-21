# React / Vue component testing

Apply [../SKILL.md](../SKILL.md) — this file is UI testing conventions only.

## What to test

- **Observable behaviour:** visible text, roles, ARIA labels, enabled/disabled state, navigation, validation messages.
- Not internal state, hook call order, or private component methods.

## React Testing Library

```tsx
it('shows validation error when password field is empty', async () => {
  render(<LoginForm />);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
});
```

- Query by role/label (`getByRole`, `getByLabelText`) before `getByTestId`.
- `userEvent` over `fireEvent` for realistic interaction.
- Assert **specific** copy and visibility, not `container.innerHTML` length.

## Vue Test Utils

```ts
it('emits submit with payload when form is valid', async () => {
  const wrapper = mount(LoginForm);
  await wrapper.find('[data-testid="password"]').setValue('secret');
  await wrapper.find('form').trigger('submit.prevent');
  expect(wrapper.emitted('submit')?.[0]).toEqual([{ email: 'a@b.com' }]);
});
```

- Prefer testing rendered output and emitted events over `$vm` internals.

## Snapshots

- Only for stable markup shells (layout components), never for computed business values.
- Review every snapshot diff before commit.
