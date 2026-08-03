Autenticación y Seguridad (Auth):

Registro e Inicio de sesión usando JWT y bcryptjs. 

Seguridad en Rutas: Endpoints protegidos mediante un middleware authMiddleware.  

Control de Propiedad: Un usuario registrado solo puede ver, editar o eliminar su propio perfil y su propia disponibilidad (req.user.id === schedule.userId).