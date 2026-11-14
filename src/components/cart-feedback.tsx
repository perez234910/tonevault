"use client";

import { useEffect } from "react";
import { useCart } from "./cart-context";
import { Icon } from "./ui/icon";

export function CartFeedback() {
  const { feedback, feedbackVisible, dismissFeedback } = useCart();
  useEffect(() => {
    if (!feedback) return;
    // Reading time, not an animation duration. Exits use shared CSS motion tokens.
    const timer = window.setTimeout(dismissFeedback, 5000);
    return () => window.clearTimeout(timer);
  }, [dismissFeedback, feedback]);
  return <div className="ui-toast" data-visible={feedbackVisible} aria-hidden={!feedbackVisible} inert={!feedbackVisible}>
    <Icon name="check" size={18} />
    <p role="status" aria-live="polite" aria-atomic="true">{feedback?.message}</p>
    <button type="button" aria-label="Dismiss cart confirmation" onClick={dismissFeedback}><Icon name="close" size={16} /></button>
  </div>;
}
