import React from 'react';
import { Route } from 'react-router-dom';
import { AuthContext } from './AuthProvider';

// Diese Komponente rendert nun direkt die gewünschte Komponente, ohne den Authentifizierungsstatus zu überprüfen.
const PrivateRoute = ({ component: Component, ...rest }) => {
    // const { isAuthenticated } = useContext(AuthContext); // Nicht mehr benötigt

    return (
        <Route
            {...rest}
            render={props => <Component {...props} />}
        />
    );
};

export default PrivateRoute;