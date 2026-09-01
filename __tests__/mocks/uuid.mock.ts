// Caminho: __tests__/mocks/uuid.mock.ts

// Simula a biblioteca uuid para evitar erros de ESM no Jest
export const v4 = jest.fn(() => 'mocked-uuid-test-1234');
export const v1 = jest.fn(() => 'mocked-uuid-test-1234');
export const v5 = jest.fn(() => 'mocked-uuid-test-1234');
export const NIL = '00000000-0000-0000-0000-000000000000';