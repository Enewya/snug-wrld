// @ts-check
/**
 * UNKNOWN email sign-up (prototype): validates the address and confirms in place, without
 * sending anything. In the theme the same markup sits inside {% form 'customer' %} and posts to
 * Shopify (customers tagged "newsletter"); this file then only needs the focus handling.
 * @param {HTMLFormElement} form
 */
export function initSignup(form) {
  const input = /** @type {HTMLInputElement} */ (form.querySelector("input[type=email]"));
  const msg = /** @type {HTMLElement} */ (form.querySelector("[data-signup-msg]"));
  const onSubmit = (/** @type {SubmitEvent} */ e) => {
    e.preventDefault();
    if (!input.checkValidity()) {
      msg.textContent = "Enter a valid email address.";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    msg.textContent = "Thanks. (Preview only: sign-up is connected when this moves to Shopify.)";
    form.reset();
  };
  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}
