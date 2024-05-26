import { check, validationResult, body } from 'express-validator'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generarJWT, generarId } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req, res) => {
    // Validacion
    await check('email').isEmail().withMessage('El Email es Obligatorio').run(req);
    await check('password').notEmpty().withMessage('La Contraseña es Obligatoria').run(req);

    let resultado = validationResult(req);

    // Verificar que el usuario esté vacío
    if (!resultado.isEmpty()) {
        // Errores
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        });
    }

    const { email, password } = req.body;
    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne({ where: { email } })
    if (!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no existe' }]
        });
    }

    // Comprobar si el usuario esta confirmado
    if (!usuario.confirmado) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'Tu cuenta no ha sido confirmada' }]
        });
    }

    // Revisar el password
    if (!usuario.VerificarPassword(password)) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'La contraseña es incorrecta' }]
        });
    }

    // Autenticar al usuario

    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre })


    console.log(token)

    // Almacenaren un cookie
    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true,
        //sameSite: true
    }).redirect('/mis-propiedades')

}

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken()
    })
}

const registrar = async (req, res) => {
    // Validación
    await check('nombre').notEmpty().withMessage('El nombre no puede estar vacío').run(req);
    await check('email').isEmail().withMessage('Eso no es un email').run(req);
    await check('password').isLength({ min: 6 }).withMessage('La contraseña debe ser de al menos 6 caracteres').run(req);
    await body('repetir_password').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Las contraseñas deben ser iguales');
        }
        return true;
    }).run(req);

    let resultado = validationResult(req);

    // Verificar que el usuario esté vacío
    if (!resultado.isEmpty()) {
        // Errores
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        });
    }

    // Extraer los datos
    const { nombre, email, password } = req.body

    // Verificar que el usuario no este duplicado
    const existeUsuario = await Usuario.findOne({ where: { email } })

    if (existeUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario ya esta registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        });
    }

    // Almacenar un usuario en la BD
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    // Envia email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    // Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina: 'Cuenta Creada Correctamente',
        mensaje: 'Hemos Enviado un Email de Confirmación, presiona en el enlace'
    })
};

// Funcion que comprueba una cuenta
const confirmar = async (req, res) => {

    const { token } = req.params;

    // Verificar si el token es valido
    const usuario = await Usuario.findOne({ where: { token } })

    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }

    // Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save()

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta Confirmada',
        mensaje: 'La cuenta se confirmo Correctamente'
    })


}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a Bienes Raices',
        csrfToken: req.csrfToken(),
    })
}

const resetPassword = async (req, res) => {

    // Validación
    await check('email').isEmail().withMessage('Eso no es un email').run(req);

    let resultado = validationResult(req);

    // Verificar que el usuario esté vacío
    if (!resultado.isEmpty()) {
        // Errores
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    // Buscar al usuario
    const { email } = req.body

    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El email no pertenece a ningun usuario' }]
        });
    }

    // Generar un token y enviar el email
    usuario.token = generarId();
    await usuario.save();

    // Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    // Renderizar un mensaje
    res.render('templates/mensaje', {
        pagina: 'Reestablece tu contraseña',
        mensaje: 'Hemos Enviado un Email con las instrucciones'
    })
}

const comprobarToken = async (req, res) => {

    const { token } = req.params;

    const usuario = await Usuario.findOne({ where: { token } })
    if (!usuario) {

        return res.render('auth/confirmar-cuenta', {
            pagina: 'Reestablece tu Contraseña',
            mensaje: 'Hubo un error al validar tu información, intenta de nuevo.',
            error: true
        })

    }

    // Mostrar formulario para modificar el nuevo password
    res.render('auth/reset-password', {
        pagina: 'Restablece tu Contraseña',
        csrfToken: req.csrfToken()
    })


}

const nuevoPassword = async (req, res) => {
    // Validar password
    await check('password').isLength({ min: 6 }).withMessage('La contraseña debe ser de al menos 6 caracteres').run(req);

    let resultado = validationResult(req);

    // Verificar que el usuario esté vacío
    if (!resultado.isEmpty()) {
        // Errores
        return res.render('auth/reset-password', {
            pagina: 'Restablece tu Contraseña',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    const { token } = req.params
    const { password } = req.body

    // Identifiar quien hace el cambio
    const usuario = await Usuario.findOne({ where: { token } })

    // Hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt)
    usuario.token = null;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Contraseña Reestablecida',
        mensaje: 'La contraseña se guardo correctamente'
    })

}

export {
    formularioLogin,
    autenticar,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}