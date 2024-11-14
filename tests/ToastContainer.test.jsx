// tests/ToastContainer.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import ToastContainer from '../src/components/ToastContainer/ToastContainer';

describe('ToastContainer Component', () => {
    test('displays message when provided', () => {
        render(
            <ToastContainer
                message="Test message"
                onClose={() => {}}
                variant="success"
            />
        );

        expect(screen.getByText(/Test message/i)).toBeInTheDocument();
    });

    test('does not display when message is empty', () => {
        render(<ToastContainer message="" onClose={() => {}} variant="success" />);

        expect(screen.queryByText(/Test message/i)).not.toBeInTheDocument();
    });
});
