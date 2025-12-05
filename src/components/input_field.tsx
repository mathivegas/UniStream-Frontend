import Input from '@mui/joy/Input';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import React from 'react'

interface InputFieldProps{
    labelText: string
    placeholder: string
    isPassword?: boolean
    name? : string
    value? : string
    onChange? : (e: React.ChangeEvent<HTMLInputElement>) => void
}

function InputField({labelText,placeholder,isPassword,name,value,onChange}:InputFieldProps) {
    return(
        <FormControl>
            <FormLabel>{labelText}</FormLabel>
            <Input 
                type={isPassword?'password':'text'} 
                variant="outlined" 
                placeholder= {placeholder} 
                size='lg' 
                fullWidth
                name = {name}
                value = {value}
                onChange = {onChange}
            />
        </FormControl>
        
    );
}

export default InputField