import '@testing-library/jest-dom';

// jsdom does not implement URL.createObjectURL / revokeObjectURL.
// Stub them so avatar-upload tests don't throw.
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock-object-url';
  URL.revokeObjectURL = () => {};
}

// jsdom does not implement scrollIntoView — stub it so MessageList scroll
// effects don't throw.
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}
