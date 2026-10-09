/** Keyboard interaction for button-based ARIA radio groups. */
export function navigateRadioGroup(event) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
  const radios = [...event.currentTarget.querySelectorAll('[role="radio"]')]
  const index = radios.indexOf(event.target)
  if (index < 0) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? radios.length - 1 :
    (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + radios.length) % radios.length
  radios[next].focus()
  radios[next].click()
}
