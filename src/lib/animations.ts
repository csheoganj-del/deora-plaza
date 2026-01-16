/**
 * flyToSummary Utility
 * A performant, DOM-based animation for "flying" items from menu to cart.
 * Now with balloon-style floating animation!
 */
export function flyToSummary(sourceEl: HTMLElement, targetEl: HTMLElement, itemId?: string) {
    if (!sourceEl || !targetEl) return;

    const sourceRect = sourceEl.getBoundingClientRect();

    // Clone the element for the animation
    const clone = sourceEl.cloneNode(true) as HTMLElement;

    // Calculate destination - try to find the specific cart item
    let finalTarget = targetEl;
    if (itemId) {
        const cartItem = targetEl.querySelector(`[data-cart-item-id="${itemId}"]`);
        if (cartItem) {
            finalTarget = cartItem as HTMLElement;
        }
    }

    const finalRect = finalTarget.getBoundingClientRect();
    const deltaX = finalRect.left + (finalRect.width / 2) - (sourceRect.left + sourceRect.width / 2);
    const deltaY = finalRect.top + (finalRect.height / 2) - (sourceRect.top + sourceRect.height / 2);

    // Balloon-style initial styles
    clone.style.position = "fixed";
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.transformOrigin = "center center";

    // Add balloon glow and styling
    clone.classList.add("fly-balloon");

    document.body.appendChild(clone);

    // Create a curved path using CSS animations
    const style = document.createElement('style');
    const animationName = `balloon-fly-${Date.now()}`;

    // Calculate arc height (balloon rises up before going to target)
    const arcHeight = -150; // Balloon rises 150px

    style.textContent = `
        @keyframes ${animationName} {
            0% {
                transform: translate(0, 0) scale(1) rotate(0deg);
                opacity: 1;
            }
            15% {
                transform: translate(${deltaX * 0.1}px, ${arcHeight * 0.5}px) scale(1.1) rotate(-5deg);
                opacity: 1;
            }
            30% {
                transform: translate(${deltaX * 0.25}px, ${arcHeight}px) scale(1.15) rotate(-8deg);
                opacity: 1;
            }
            50% {
                transform: translate(${deltaX * 0.5}px, ${arcHeight * 0.8}px) scale(1.1) rotate(0deg);
                opacity: 1;
            }
            70% {
                transform: translate(${deltaX * 0.75}px, ${deltaY * 0.5}px) scale(0.8) rotate(5deg);
                opacity: 0.9;
            }
            85% {
                transform: translate(${deltaX * 0.9}px, ${deltaY * 0.8}px) scale(0.5) rotate(8deg);
                opacity: 0.6;
            }
            100% {
                transform: translate(${deltaX}px, ${deltaY}px) scale(0.2) rotate(12deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Trigger animation next frame
    requestAnimationFrame(() => {
        clone.style.animation = `${animationName} 1400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
    });

    // Cleanup
    setTimeout(() => {
        clone.remove();
        style.remove();

        // Add pulse feedback to target
        finalTarget.classList.add("pulse-feedback");
        setTimeout(() => finalTarget.classList.remove("pulse-feedback"), 400);
    }, 1450);
}
