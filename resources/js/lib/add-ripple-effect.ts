import { MouseEvent } from 'react';

export function addRippleEffect(event: MouseEvent<HTMLElement>) {
    // Find the closest element with the 'ripple' class
    const target = (event.target as HTMLElement).closest('.ripple') as HTMLElement;

    if (!target) return;

    // Get the bounding rectangle of the target element
    const rect = target.getBoundingClientRect();

    // Create a span element for the ripple
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    // Set styles for the ripple
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple-effect';

    // Append the ripple to the target element
    target.appendChild(ripple);

    // Remove the ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600); // Match the duration of the ripple-animation
}
