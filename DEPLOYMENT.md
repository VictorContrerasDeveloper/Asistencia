# Cómo Publicar tu Aplicación

Publicar (o "desplegar") tu aplicación significa hacerla accesible en Internet para que cualquiera pueda visitarla a través de una URL. Dado que este proyecto está construido con Firebase, usaremos **Firebase App Hosting**, que está diseñado específicamente para aplicaciones web como esta.

Aquí tienes una guía paso a paso para publicar tu aplicación. Deberás ejecutar estos comandos en tu terminal local, en la carpeta raíz de tu proyecto.

## Prerrequisitos

Antes de empezar, asegúrate de tener instalada la **Firebase CLI (Command Line Interface)**. Si no la tienes, puedes instalarla globalmente usando npm (Node.js) con el siguiente comando:

```bash
npm install -g firebase-tools
```

## Paso 1: Inicia Sesión en Firebase

El primer paso es iniciar sesión en tu cuenta de Google asociada con Firebase.

```bash
firebase login
```

Este comando abrirá una ventana en tu navegador para que inicies sesión y autorices a la Firebase CLI a actuar en tu nombre.

## Paso 2: Conecta tu Proyecto Local

Ahora, necesitas conectar tu carpeta local con el proyecto de Firebase que hemos estado usando.

```bash
firebase init apphosting
```

Cuando ejecutes este comando, la CLI te hará algunas preguntas:

1.  **"Please select a project"**: Te mostrará una lista de tus proyectos de Firebase. Selecciona el proyecto `attendance-hero-av2o3`.
2.  **"Please specify a name for your backend"**: Puedes darle un nombre (por ejemplo, `attendance-hero-backend`) o presionar Enter para usar el que te sugiere por defecto.

Esto creará un archivo `.firebaserc` que le dice a la CLI a qué proyecto de Firebase debe conectarse.

## Paso 3: Despliega la Aplicación

Este es el comando final. Se encargará de construir tu aplicación de Next.js, subirla a Firebase y publicarla.

```bash
firebase apphosting:backends:deploy [BACKEND_ID] --region=us-central1
```

**Importante**: Reemplaza `[BACKEND_ID]` con el nombre que le diste a tu backend en el paso anterior. Si no recuerdas el nombre, puedes encontrarlo ejecutando `firebase apphosting:backends:list`.

El proceso de despliegue puede tardar unos minutos. La CLI te mostrará el progreso.

## Paso 4: ¡Visita tu Aplicación!

Una vez que el despliegue haya terminado, la Firebase CLI te mostrará un mensaje de éxito y la **URL pública** de tu aplicación. ¡Copia esa URL, pégala en tu navegador y listo! Tu aplicación "Attendance Hero" estará en línea.

Cada vez que hagas cambios y quieras actualizarlos, solo necesitarás repetir el **Paso 3**.

---

## ¿Cómo se me cobrará por esta aplicación?

Es una pregunta muy importante. Aquí te explico de forma sencilla cómo funciona el cobro en Firebase para una aplicación como "Attendance Hero":

### El Plan Gratuito (Spark Plan)

Por defecto, tu proyecto de Firebase está en el **Plan Spark**, que es un plan **gratuito**. Este plan está diseñado para que puedas empezar a desarrollar y lanzar tu aplicación sin costo alguno. Incluye cuotas generosas para los servicios que estamos usando:

1.  **Firestore (Base de Datos)**:
    *   **Almacenamiento**: Tienes **1 GiB** de almacenamiento gratuito. Para una app de asistencia, donde cada empleado y cada oficina es un pequeño documento de texto, esto es muchísimo espacio. Probablemente nunca te acerques a este límite a menos que tengas cientos de miles de empleados.
    *   **Operaciones de Lectura/Escritura**: Tienes **50,000 lecturas** y **20,000 escrituras** de documentos *por día*, de forma gratuita. Cada vez que cargas la lista de personal, haces una lectura. Cada vez que cambias el estado de un empleado (de "Presente" a "Ausente"), haces una escritura. Es muy poco probable que excedas estos límites con un uso normal.

2.  **Firebase App Hosting (Alojamiento Web)**:
    *   **Almacenamiento**: Tienes **10 GB** de almacenamiento gratuito para los archivos de tu aplicación. Tu aplicación actual ocupa solo unos pocos megabytes.
    *   **Transferencia de Datos**: Tienes **360 MB** de transferencia de datos *por día*. Esto es el tráfico que se genera cuando los usuarios visitan tu app. De nuevo, es una cuota muy generosa para empezar.

### ¿Cuándo tendrías que pagar?

Solo tendrías que pagar si decides cambiar tu proyecto al **Plan Blaze (pago por uso)** y *además* superas las cuotas gratuitas. El Plan Blaze sigue teniendo las mismas cuotas gratuitas que el Plan Spark, pero te permite excederlas si tu aplicación crece mucho.

**En resumen:** Para una aplicación como "Attendance Hero", con una cantidad normal de oficinas y empleados, **es muy probable que tu uso se mantenga dentro del plan gratuito de Firebase de forma indefinida**. No se te cobrará nada a menos que actualices manualmente tu proyecto al plan de pago y tu aplicación reciba un tráfico o un volumen de datos masivo.

---

## Diferencia: Firebase Hosting vs. Cloud Storage vs. Firestore

Es una duda muy común. Aquí te explicamos la diferencia de forma sencilla con una analogía.

Imagina que estás construyendo una tienda en línea:

*   **Firebase Hosting** es como el **local de la tienda**. Es el espacio donde construyes tu tienda, pones los estantes, las luces y la vitrina. Es lo que los clientes visitan. En términos de tu aplicación, **Hosting** es donde se alojan los archivos que la hacen funcionar (HTML, CSS, JavaScript). Cuando publicas tu app con `firebase apphosting:deploy`, estás subiendo los archivos de tu aplicación a Hosting para que la gente pueda visitarla en una URL.
    *   **Uso en nuestra app**: La usamos para servir la aplicación de "Attendance Hero" a los usuarios.

*   **Cloud Storage for Firebase** es como la **bodega o el almacén** de tu tienda. No es la tienda en sí, sino el lugar donde guardas los productos que vendes, como cajas de zapatos o ropa. En términos de tu aplicación, **Storage** se usa para que los *usuarios* de la app suban, almacenen y descarguengan archivos, como fotos de perfil, videos, PDFs, etc.
    *   **Uso en nuestra app**: Actualmente *no* la estamos usando, porque nuestra aplicación no necesita que los usuarios suban ningún tipo de archivo.

*   **Cloud Firestore** es el **archivador inteligente** de la tienda. Es la base de datos donde se guarda, organiza y consulta toda la información estructurada que la aplicación necesita para funcionar, como la lista de empleados, las oficinas o el estado de la asistencia. No guarda archivos grandes, sino datos organizados que deben ser accedidos y actualizados rápidamente.
    *   **Uso en nuestra app**: ¡Es el corazón de la aplicación! La usamos para guardar la lista de oficinas, todo el personal y su estado de asistencia en tiempo real.

### Resumen Rápido

| Servicio | Analogía | ¿Para qué sirve? | ¿Lo usamos en esta app? |
| :--- | :--- | :--- | :--- |
| **Firebase Hosting** | El local de la tienda | Para alojar y servir los archivos de tu aplicación web (el "motor" de la app). | **Sí**, para que puedas visitar y usar "Attendance Hero". |
| **Cloud Storage** | La bodega de la tienda | Para almacenar y gestionar archivos subidos por los usuarios (fotos, videos, etc.). | **No**, porque la app no tiene esa funcionalidad. |
| **Cloud Firestore** | El archivador | Para guardar y sincronizar los datos estructurados de la app en tiempo real. | **Sí**, es nuestra base de datos principal. |
