'use client';

import React, { InputHTMLAttributes } from 'react';

// Define the props interface, extending native input attributes for flexibility
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const TextInput: React.FC<TextInputProps> = ({ ...props }) => {


  return (
    <div className="form-field">
      <input
        type="text"
        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
        {...props}
      />
    </div>
  );
};

export default TextInput;
