'use client';

import React, { InputHTMLAttributes, useState } from 'react';

// Define the props interface, extending native input attributes for flexibility
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const TextInput: React.FC<TextInputProps> = ({ label, id, ...props }) => {
  const [value, setValue] = useState<string>('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    if (props.onChange) {
      props.onChange(event);
    }
  };

  return (
    <div className="form-field">
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
        {...props}
      />
    </div>
  );
};

export default TextInput;
