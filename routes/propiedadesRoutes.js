import express from 'express'
import { body } from 'express-validator'
import { admin, crear, guardar } from '../controllers/propiedadController.js'
import { ExpressValidator } from 'express-validator'

const router = express.Router()

router.get('/mis-propiedades', admin)
router.get('/propiedades/crear', crear)
router.post('/propiedades/crear',

    body('titulo').notEmpty().withMessage('El Titulo del Anuncio es Obligario'),
    body('descripcion')
        .notEmpty().withMessage('La descripcion no puede ir vacia')
        .isLength({ max: 200 }).withMessage('La descripcion es muy larga'),
    body('categoria').isNumeric().withMessage('Selecciona una categoria'),
    body('precio').isNumeric().withMessage('Selecciona un rango de precios'),
    body('habitaciones').isNumeric().withMessage('Selecciona la cantidad de habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Selecciona la cantidad de estacionamientos'),
    body('wc').isNumeric().withMessage('Selecciona la cantidad de baños'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
    guardar
)

export default router