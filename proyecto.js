class Proveedor {
    constructor(nombre, telefono, categoria) {
        this.nombre = nombre;
        this.telefono = telefono;
        this.categoria = categoria;
    }
}

class ProductoBase {
    #id;
    #precioCosto;
    #stock;

    constructor(id, nombre, categoria, marca, litros, precioCosto, precioVenta, stock, proveedor, imagen) {
        if (new.target === ProductoBase) {
            throw new Error("No se puede instanciar la clase abstracta ProductoBase directamente");
        }
        this.#id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.marca = marca;
        this.litros = Number(litros);
        this.#precioCosto = Number(precioCosto);
        this.precioVenta = Number(precioVenta);
        this.#stock = Number(stock);
        this.proveedor = proveedor;
        this.imagen = imagen || "bebidagenerica.png";
    }

    get id() { return this.#id; }
    get stock() { return this.#stock; }
    get precioCosto() { return this.#precioCosto; }

    obtenerDetalle(modoOFormato) {
        return this.marca + " - " + this.litros + "L";
    }
    static validarStockMinimo(stock) {
        if (stock <= 5) {
            return "Stock bajo";
        } else {
            return "Disponible";
        }
    }

    toJSON() {
        return {
            id: this.#id,
            nombre: this.nombre,
            categoria: this.categoria,
            marca: this.marca,
            litros: this.litros,
            precioCosto: this.#precioCosto,
            precioVenta: this.precioVenta,
            stock: this.#stock,
            proveedor: this.proveedor,
            imagen: this.imagen,
            tipoClase: this.constructor.name
        };
    }
}

class BebidaGaseosa extends ProductoBase {
    constructor(id, nombre, categoria, marca, litros, precioCosto, precioVenta, stock, proveedor, imagen) {
        super(id, nombre, categoria, marca, litros, precioCosto, precioVenta, stock, proveedor, imagen);
    }

    obtenerDetalle(modoOFormato) {
        if (modoOFormato === true) {
            return this.marca + " - " + this.litros + "L";
        }
        if (modoOFormato === "precio") {
            return this.marca + " - " + this.litros + "L, Bs " + this.precioVenta.toFixed(2);
        }
        return "Bebida: " + this.marca + " - " + this.litros + "L";
    }
}

class BebidaEnergetica extends ProductoBase {
    constructor(id, nombre, categoria, marca, litros, precioCosto, precioVenta, stock, proveedor, imagen) {
        super(id, nombre, categoria, marca, litros, precioCosto, precioVenta, stock, proveedor, imagen);
    }
    obtenerDetalle(modoOFormato) {
        if (modoOFormato === true) {
            return this.marca + " - " + this.litros + "L";
        }
        if (modoOFormato === "precio") {
            return this.marca + " - " + this.litros + "L, Bs " + this.precioVenta.toFixed(2);
        }
        return "Energizante: " + this.marca + " - " + this.litros + "L";
    }
}

let proveedores = [];
let inventario = [];
let indiceEdicion = -1;
let indiceEdicionProveedor = -1;

function cambiarPestaña(idVista, boton) {
    let vistas = document.querySelectorAll(".vista");
    for (let i = 0; i < vistas.length; i++) {
        vistas[i].classList.remove("activo");
    }

    let botones = document.querySelectorAll(".pestañaBtn");
    for (let i = 0; i < botones.length; i++) {
        botones[i].classList.remove("activo");
    }

    if (idVista === 'catalogo') {
        document.getElementById("vistaCatalogo").classList.add("activo");
        renderizarCatalogo(inventario);
    } else if (idVista === 'admin') {
        document.getElementById("vistaAdmin").classList.add("activo");
        actualizarSelectProveedores();
        renderizarInventario();
    } else if (idVista === 'proveedores') {
        document.getElementById("vistaProveedores").classList.add("activo");
        renderizarProveedores();
    } else if (idVista === 'archivos') {
        document.getElementById("vistaArchivos").classList.add("activo");
    }
    
    if (boton) {
        boton.classList.add("activo");
    } else {
        for (let i = 0; i < botones.length; i++) {
            if (botones[i].getAttribute("onclick").includes(idVista)) {
                botones[i].classList.add("activo");
            }
        }
    }
}

function guardarProveedor() {
    let nombre = document.getElementById("provNombre").value.trim();
    let tel = document.getElementById("provTelefono").value.trim();
    let cat = document.getElementById("provCategoria").value.trim();
    let mensaje = document.getElementById("mensajeProveedor");
    let campoTel = document.getElementById("provTelefono");

    if (nombre === "" || tel === "" || cat === "") {
        mensaje.textContent = "ERROR. Todos los campos del proveedor son obligatorios";
        mensaje.style.color = "red";
        return;
    }

    let regexTelefono = /^\d{7,10}$/;
    if (!regexTelefono.test(tel)) {
        campoTel.classList.add("campo-error");
        mensaje.textContent = "ERROR. El teléfono debe contener solo números (entre 7 y 10 dígitos)";
        mensaje.style.color = "red";
        return;
    } else {
        campoTel.classList.remove("campo-error");
    }

    if (indiceEdicionProveedor === -1) {
        let nuevoProv = new Proveedor(nombre, tel, cat);
        proveedores.push(nuevoProv);
        mensaje.textContent = "Proveedor registrado correctamente";
    } else {
        let proveedorAntiguo = proveedores[indiceEdicionProveedor].nombre;

        proveedores[indiceEdicionProveedor].nombre = nombre;
        proveedores[indiceEdicionProveedor].telefono = tel;
        proveedores[indiceEdicionProveedor].categoria = cat;

        if (proveedorAntiguo !== nombre) {
            for (let i = 0; i < inventario.length; i++) {
                if (inventario[i].proveedor === proveedorAntiguo) {
                    inventario[i].proveedor = nombre;
                }
            }
        }
        mensaje.textContent = "Proveedor modificado correctamente";
        indiceEdicionProveedor = -1;
        document.getElementById("btnAccionProveedor").textContent = "Guardar Proveedor";
        document.getElementById("btnCancelarProveedor").style.display = "none";
    }

    mensaje.style.color = "green";
    limpiarFormularioProveedorCampos();
    actualizarSelectProveedores();
    renderizarProveedores();
    renderizarInventario();
}

function cargarProveedorParaModificar(index) {
    let p = proveedores[index];
    document.getElementById("provNombre").value = p.nombre;
    document.getElementById("provTelefono").value = p.telefono;
    document.getElementById("provCategoria").value = p.categoria;

    indiceEdicionProveedor = index;
    document.getElementById("btnAccionProveedor").textContent = "Guardar Cambios";
    document.getElementById("btnCancelarProveedor").style.display = "inline-block";
    document.getElementById("mensajeProveedor").textContent = "Modificando proveedor seleccionado";
    document.getElementById("mensajeProveedor").style.color = "blue";
}

function eliminarProveedor(index) {
    let provAEliminar = proveedores[index];
    let mensaje = document.getElementById("mensajeProveedor");

    let tieneProductos = false;
    for (let i = 0; i < inventario.length; i++) {
        if (inventario[i].proveedor === provAEliminar.nombre) {
            tieneProductos = true;
            break;
        }
    }

    if (tieneProductos) {
        mensaje.textContent = "ERROR. No se puede eliminar el proveedor '" + provAEliminar.nombre + "' porque tiene productos asociados";
        mensaje.style.color = "red";
        return;
    }

    proveedores.splice(index, 1);
    actualizarSelectProveedores();
    renderizarProveedores();
    mensaje.textContent = "Proveedor eliminado correctamente";
    mensaje.style.color = "green";
}

function limpiarFormularioProveedor() {
    indiceEdicionProveedor = -1;
    limpiarFormularioProveedorCampos();
    document.getElementById("btnAccionProveedor").textContent = "Guardar Proveedor";
    document.getElementById("btnCancelarProveedor").style.display = "none";
    let mensaje = document.getElementById("mensajeProveedor");
    mensaje.textContent = "Edicion cancelada";
    mensaje.style.color = "gray";
}

function limpiarFormularioProveedorCampos() {
    document.getElementById("provNombre").value = "";
    document.getElementById("provTelefono").value = "";
    document.getElementById("provCategoria").value = "";
    document.getElementById("provTelefono").classList.remove("campo-error");
}

function actualizarSelectProveedores() {
    let select = document.getElementById("prodProveedor");
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione un proveedor</option>';
    for (let i = 0; i < proveedores.length; i++) {
        let p = proveedores[i];
        select.innerHTML += '<option value="' + p.nombre + '">' + p.nombre + ' (' + p.categoria + ')</option>';
    }
}

function guardarProducto() {
    let formAdmin = document.getElementById("formAdmin");
    let mensaje = document.getElementById("mensajeAdmin");

    if (!formAdmin.checkValidity()) {
        formAdmin.reportValidity();
        return;
    }
    let id = document.getElementById("prodId").value.trim();
    let nombre = document.getElementById("prodNombre").value.trim();
    let categoria = document.getElementById("prodCategoriaSelect").value;
    let marca = document.getElementById("prodMarca").value.trim();
    let litros = document.getElementById("prodLitros").value;
    let costo = document.getElementById("prodCosto").value;
    let venta = document.getElementById("prodVenta").value;
    let stock = document.getElementById("prodStock").value;
    let proveedor = document.getElementById("prodProveedor").value;

    let stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
        mensaje.textContent = "ERROR. El stock actual debe ser un número entero";
        mensaje.style.color = "red";
        return;
    }

    let existeDuplicado = false;
    for (let i = 0; i < inventario.length; i++) {
        if (i !== indiceEdicion && inventario[i].id.toLowerCase() === id.toLowerCase()) {
            existeDuplicado = true;
            break;
        }
    }
    if (existeDuplicado) {
        mensaje.textContent = "ERROR. Ya existe otro producto registrado con el código '" + id + "'";
        mensaje.style.color = "red";
        return;
    }

    if (Number(costo) < 0 || Number(venta) < 0) {
        mensaje.textContent = "ERROR. El costo y el precio de venta no pueden ser negativos";
        mensaje.style.color = "red";
        return;
    }

    if (Number(costo) > Number(venta)) {
        mensaje.textContent = "ERROR. El precio de costo no puede ser mayor al precio de venta";
        mensaje.style.color = "red";
        return;
    }

    let imagenPorDefecto = "bebidagenerica.png";
    let productoCreado;
    
    if (categoria === "Energizante") {
        productoCreado = new BebidaEnergetica(id, nombre, categoria, marca, litros, costo, venta, stockNum, proveedor, imagenPorDefecto);
    } else {
        productoCreado = new BebidaGaseosa(id, nombre, categoria, marca, litros, costo, venta, stockNum, proveedor, imagenPorDefecto);
    }

    if (indiceEdicion === -1) {
        inventario.push(productoCreado);
        mensaje.textContent = "Producto registrado correctamente";
    } else {
        productoCreado.imagen = inventario[indiceEdicion].imagen;
        inventario[indiceEdicion] = productoCreado;
        mensaje.textContent = "Producto modificado correctamente";
        indiceEdicion = -1;
        document.getElementById("btnAccionForm").textContent = "Registrar Producto";
        document.getElementById("btnCancelarForm").style.display = "none";
    }

    mensaje.style.color = "green";
    formAdmin.reset();
    renderizarCatalogo(inventario);
    renderizarInventario();
}

function cargarProductoParaModificar(index) {
    let prod = inventario[index];
    cambiarPestaña('admin');
    document.getElementById("prodId").value = prod.id;
    document.getElementById("prodNombre").value = prod.nombre;
    document.getElementById("prodCategoriaSelect").value = prod.categoria;
    document.getElementById("prodMarca").value = prod.marca;
    document.getElementById("prodLitros").value = Number(prod.litros).toFixed(1);
    document.getElementById("prodCosto").value = prod.precioCosto;
    document.getElementById("prodVenta").value = prod.precioVenta;
    document.getElementById("prodStock").value = prod.stock;
    document.getElementById("prodProveedor").value = prod.proveedor;

    indiceEdicion = index;
    document.getElementById("btnAccionForm").textContent = "Guardar Cambios";
    document.getElementById("btnCancelarForm").style.display = "inline-block";
    document.getElementById("mensajeAdmin").textContent = "Modificando producto seleccionado";
    document.getElementById("mensajeAdmin").style.color = "blue";
}

function eliminarProducto(index) {
    inventario.splice(index, 1);
    renderizarInventario();
    renderizarCatalogo(inventario);
}

function limpiarFormularioProducto() {
    indiceEdicion = -1;
    limpiarFormularioProductoCampos();
    document.getElementById("btnAccionForm").textContent = "Registrar Producto";
    document.getElementById("btnCancelarForm").style.display = "none";
    let mensaje = document.getElementById("mensajeAdmin");
    mensaje.textContent = "Edicion cancelada";
    mensaje.style.color = "gray";
}

function limpiarFormularioProductoCampos() {
    document.getElementById("prodId").value = "";
    document.getElementById("prodNombre").value = "";
    document.getElementById("prodMarca").value = "";
    document.getElementById("prodCosto").value = "";
    document.getElementById("prodVenta").value = "";
    document.getElementById("prodStock").value = "";
}

function renderizarInventario() {
    let tbody = document.getElementById("tablaInventario");
    if (!tbody) return;
    tbody.innerHTML = "";
    for (let i = 0; i < inventario.length; i++) {
        let prod = inventario[i];
        let estadoStock = ProductoBase.validarStockMinimo(prod.stock);
        let claseStock = prod.stock <= 5 ? "textoAlerta" : "";
        let detalleConSobrecarga = prod.obtenerDetalle(true) + " <br><small>Prov: " + prod.proveedor + "</small>";
        
        tbody.innerHTML += "<tr>" +
            "<td>" + prod.id + "</td>" +
            "<td><strong>" + prod.nombre + "</strong></td>" +
            "<td>" + detalleConSobrecarga + "</td>" +
            "<td>Bs " + prod.precioCosto + "</td>" +
            "<td>Bs " + prod.precioVenta + "</td>" +
            "<td class='" + claseStock + "'>" + prod.stock + " (" + estadoStock + ")</td>" +
            "<td>" +
                "<button onclick='cargarProductoParaModificar(" + i + ")' class='botonAzul botonAccion margenDerecha'>Modificar</button>" +
                "<button onclick='eliminarProducto(" + i + ")' class='botonNaranja botonAccion'>Eliminar</button>" +
            "</td>" +
        "</tr>";
    }
}

function renderizarProveedores() {
    let tbody = document.getElementById("tablaProveedores");
    if (!tbody) return;
    tbody.innerHTML = "";
    for (let i = 0; i < proveedores.length; i++) {
        let p = proveedores[i];
        tbody.innerHTML += "<tr>" +
            "<td>" + p.nombre + "</td>" +
            "<td>" + p.telefono + "</td>" +
            "<td>" + p.categoria + "</td>" +
            "<td>" +
                "<button onclick='cargarProveedorParaModificar(" + i + ")' class='botonAzul botonAccion margenDerecha'>Modificar</button>" +
                "<button onclick='eliminarProveedor(" + i + ")' class='botonNaranja botonAccion'>Eliminar</button>" +
            "</td>" +
        "</tr>";
    }
}

function renderizarCatalogo(lista) {
    let contenedor = document.getElementById("contenedorTarjetas");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = "<p>No hay bebidas registradas en esta categoría</p>";
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let prod = lista[i];
        contenedor.innerHTML += '<div class="tarjeta">' +
            '<img src="' + prod.imagen + '" alt="' + prod.nombre + '" onerror="this.src=\'bebidagenerica.png\'">' +
            '<div>' +
                '<h4>' + prod.nombre + '</h4>' +
                '<p><strong>' + prod.marca + '</strong> (' + prod.litros + ' L)</p>' +
                '<p>Precio: <strong>Bs ' + prod.precioVenta + '</strong></p>' +
                '<p class="tarjetaStock">Stock: ' + prod.stock + '</p>' +
            '</div>' +
        '</div>';
    }
}

function filtrarCategoria(cat) {
    if (cat === 'todos') {
        renderizarCatalogo(inventario);
        return;
    }
    let listaFiltrada = [];
    for (let i = 0; i < inventario.length; i++) {
        if (inventario[i].categoria === cat) {
            listaFiltrada.push(inventario[i]);
        }
    }
    renderizarCatalogo(listaFiltrada);
}

function filtrarCatalogo() {
    let buscadorEl = document.getElementById("buscador");
    if (!buscadorEl) return;
    let texto = buscadorEl.value.toLowerCase();
    let listaFiltrada = [];

    for (let i = 0; i < inventario.length; i++) {
        let prod = inventario[i];
        let nombreMinuscula = prod.nombre.toLowerCase();
        let marcaMinuscula = prod.marca.toLowerCase();

        if (nombreMinuscula.indexOf(texto) !== -1 || marcaMinuscula.indexOf(texto) !== -1) {
            listaFiltrada.push(prod);
        }
    }
    renderizarCatalogo(listaFiltrada);
}

function exportarDatosJSON() {
    let datosCompletos = {
        inventario: inventario,
        proveedores: proveedores
    };

    let datos = JSON.stringify(datosCompletos, null, 2);
    let blob = new Blob([datos], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "inventario_y_proveedores.json";
    a.click();
    
    let mensaje = document.getElementById("mensajeArchivo");
    mensaje.textContent = "Archivo JSON exportado correctamente";
    mensaje.style.color = "green";
}

function importarDatosJSON(event) {
    let archivo = event.target.files[0];
    if (!archivo) return;
    let lector = new FileReader();
    
    lector.onload = function(e) {
        let mensaje = document.getElementById("mensajeArchivo");
        try {
            let contenido = JSON.parse(e.target.result);
            
            if (!contenido || typeof contenido !== 'object') {
                throw new Error("El archivo JSON no tiene la estructura de objeto raíz válida.");
            }

            let datosInventario = [];
            let datosProveedores = [];

            if (Array.isArray(contenido)) {
                datosInventario = contenido;
            } else {
                if (!contenido.inventario || !Array.isArray(contenido.inventario)) {
                    throw new Error("La propiedad 'inventario' falta o no es un arreglo válido.");
                }
                if (!contenido.proveedores || !Array.isArray(contenido.proveedores)) {
                    throw new Error("La propiedad 'proveedores' falta o no es un arreglo válido.");
                }
                datosInventario = contenido.inventario;
                datosProveedores = contenido.proveedores;
            }

            let idsImportados = new Set();
            for (let i = 0; i < datosInventario.length; i++) {
                let d = datosInventario[i];
                
                if (!d.id || !d.nombre || d.precioVenta === undefined || d.stock === undefined || d.precioCosto === undefined) {
                    throw new Error("Un producto en el JSON carece de atributos esenciales obligatorios.");
                }

                let idLower = String(d.id).trim().toLowerCase();
                
                if (idsImportados.has(idLower)) {
                    throw new Error("El archivo JSON contiene códigos de producto duplicados ('" + d.id + "')");
                }
                idsImportados.add(idLower);

                let stockNum = Number(d.stock);
                let costoNum = Number(d.precioCosto);
                let ventaNum = Number(d.precioVenta);

                if (!Number.isInteger(stockNum) || stockNum < 0) {
                    throw new Error("El producto '" + d.id + "' tiene un stock inválido o negativo");
                }

                if (costoNum < 0 || ventaNum < 0) {
                    throw new Error("El producto '" + d.id + "' tiene costos o precios de venta negativos");
                }

                if (costoNum > ventaNum) {
                    throw new Error("El producto '" + d.id + "' tiene un precio de costo mayor al de venta");
                }
            }

            for (let i = 0; i < datosProveedores.length; i++) {
                let pr = datosProveedores[i];
                if (!pr.nombre || !pr.telefono) {
                    throw new Error("Un proveedor en el JSON no tiene nombre o teléfono");
                }
            }

            let nuevoInventario = [];
            for (let i = 0; i < datosInventario.length; i++) {
                let d = datosInventario[i];
                let p;
                if (d.categoria === "Energizante" || d.tipoClase === "BebidaEnergetica") {
                    p = new BebidaEnergetica(d.id, d.nombre, d.categoria, d.marca, d.litros, d.precioCosto, d.precioVenta, d.stock, d.proveedor, d.imagen);
                } else {
                    p = new BebidaGaseosa(d.id, d.nombre, d.categoria, d.marca, d.litros, d.precioCosto, d.precioVenta, d.stock, d.proveedor, d.imagen);
                }
                nuevoInventario.push(p);
            }

            let nuevosProveedores = [];
            for (let i = 0; i < datosProveedores.length; i++) {
                let pr = datosProveedores[i];
                nuevosProveedores.push(new Proveedor(pr.nombre, pr.telefono, pr.categoria));
            }

            inventario = nuevoInventario;
            proveedores = nuevosProveedores;

            renderizarCatalogo(inventario);
            renderizarInventario();
            renderizarProveedores();
            actualizarSelectProveedores();
            
            mensaje.textContent = "Archivo JSON importado correctamente";
            mensaje.style.color = "green";
        } catch (err) {
            mensaje.textContent = "ERROR DE VALIDACIÓN: " + err.message;
            mensaje.style.color = "red";
        }
    };
    lector.readAsText(archivo);
}
const SEPARADOR_CSV = ",";

function escaparCampoCSV(valor) {
    let texto = String(valor);
    if (texto.indexOf(SEPARADOR_CSV) !== -1 || texto.indexOf('"') !== -1 ||
        texto.indexOf("\n") !== -1 || texto.indexOf("\r") !== -1) {
        texto = '"' + texto.replace(/"/g, '""') + '"';
    }
    return texto;
}

function exportarCSV() {
    let mensaje = document.getElementById("mensajeArchivo");
    let url = null;

    try {
        if (inventario.length === 0) {
            mensaje.textContent = "ERROR. No hay productos para exportar";
            mensaje.style.color = "red";
            return;
        }

        let encabezado = ["ID", "Nombre", "Categoria", "Marca", "Litros",
                          "PrecioCosto", "PrecioVenta", "Stock", "Estado", "Proveedor"];
        let lineas = [encabezado.join(SEPARADOR_CSV)];

        for (let i = 0; i < inventario.length; i++) {
            let p = inventario[i];
            let fila = [p.id, p.nombre, p.categoria, p.marca, p.litros,
                        p.precioCosto, p.precioVenta, p.stock,
                        ProductoBase.validarStockMinimo(p.stock), p.proveedor];
            lineas.push(fila.map(escaparCampoCSV).join(SEPARADOR_CSV));
        }
        let csv = "\uFEFF" + lineas.join("\r\n");

        let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "reporte_stock.csv";
        a.click();

        mensaje.textContent = "Reporte CSV exportado correctamente (" + inventario.length + " productos)";
        mensaje.style.color = "green";
    } catch (err) {
        mensaje.textContent = "ERROR al exportar el CSV: " + err.message;
        mensaje.style.color = "red";
    } finally {
        if (url) {
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        }
    }
}
document.addEventListener("DOMContentLoaded", function() {
    cambiarPestaña("catalogo");
});