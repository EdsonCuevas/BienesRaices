import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad } from '../models/index.js'

const admin = (req, res) => {
    res.render('propiedades/admin', {
        pagina: 'Mis Propiedades',
        barra: true
    })
}

// Formulario para crear una nueva propiedad
const crear = async (req, res) => {
    // Consultar modelo de precio y categoria
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        barra: true,
        csrfToken: req.csrfToken(),
        categorias: categorias,
        precios: precios,
        datos: ''
    })
}

const guardar = async (req, res) => {
    // Validacion
    let resultado = validationResult(req)

    if (!resultado.isEmpty()) {

        // Consultar modelo de precio y categoria
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            barra: true,
            csrfToken: req.csrfToken(),
            categorias: categorias,
            precios: precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    // Crear un registro

    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio, categoria } = req.body

    try {
        const PropiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            PrecioId: precio,
            CategoriaId: categoria


        })

    } catch (error) {
        console.log(error)
    }

}

export {
    admin,
    crear,
    guardar
}