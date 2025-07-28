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
