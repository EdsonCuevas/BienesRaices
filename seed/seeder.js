import { exit } from 'node:process';
import categorias from "./categorias.js";
import precios from "./precios.js";
import Categoria from "../models/categoria.js";
import Precio from "../models/Precio.js";
import db from '../config/db.js';

const importarDatos = async () => {
    try {
        // Autenticar
        await db.authenticate()

        // Generar las columnas
        await db.sync()

        // Insertamos los datos
        await Promise.all([
            Categoria.bulkCreate(categorias),
            Precio.bulkCreate(precios)
        ])

        console.log('Datos importados correctamente')
        exit()

    } catch (error) {
        console.log(error)
        exit(1)
    }
}

if (process.argv[2] === "-i") {
    importarDatos();
}