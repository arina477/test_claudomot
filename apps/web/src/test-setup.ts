import '@testing-library/jest-dom';

// jsdom does not implement URL.createObjectURL / revokeObjectURL.
// Stub them so avatar-upload tests don't throw.
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock-object-url';
  URL.revokeObjectURL = () => {};
}
