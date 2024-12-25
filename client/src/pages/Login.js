import React, { useState } from 'react';
import api from '../api';

function Login() {
    const [response, setResponse] = useState('');

    const testApi = async () => {
        try {
            const res = await api.get('/auth/test');
            setResponse(res.data);
        } catch (error) {
            console.error(error);
            setResponse('API Error');
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <button onClick={testApi}>Test API Connection</button>
            <p>Response: {response}</p>
        </div>
    );
}

export default Login;
