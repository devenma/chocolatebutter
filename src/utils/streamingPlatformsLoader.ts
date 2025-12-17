/**
 * Observa la adición del contenido dinámico de streaming platforms
 * y reemplaza progresivamente los elementos estáticos con los dinámicos
 */
function initStreamingPlatformsObserver() {
  const container = document.body;

  // Función para reemplazar elementos progresivamente
  function replaceElementsProgressively(
    staticList: HTMLElement,
    dynamicList: HTMLElement
  ) {
    const staticItems = Array.from(staticList.querySelectorAll("li"));
    const dynamicItems = Array.from(dynamicList.querySelectorAll("li"));

    // El dinámico ya está con display: none, lo mantenemos así
    dynamicList.style.opacity = "0";

    let currentIndex = 0;
    const replacementDelay = 200; // Delay entre reemplazos en ms

    function replaceNextItem() {
      if (currentIndex >= staticItems.length) {
        // Todos los estáticos han sido procesados
        // Ahora mostrar los dinámicos restantes con fade in (si los hay)
        if (dynamicItems.length > staticItems.length) {
          const remainingItems = dynamicItems.slice(staticItems.length);
          remainingItems.forEach((item, idx) => {
            item.style.opacity = "0";
            item.style.transition = "opacity 0.3s ease-in";
            setTimeout(() => {
              item.style.opacity = "1";
            }, idx * replacementDelay);
          });
        }

        // Finalmente, remover la lista estática y mostrar la dinámica
        staticList.remove();
        dynamicList.style.display = "";
        dynamicList.style.opacity = "1";

        return;
      }

      if (currentIndex < dynamicItems.length) {
        // Hay un dinámico correspondiente, reemplazarlo
        const staticItem = staticItems[currentIndex];
        const dynamicItem = dynamicItems[currentIndex];

        // Fade out del elemento estático
        staticItem.style.opacity = "0";
        staticItem.style.transition = "opacity 0.15s ease-out";

        setTimeout(() => {
          // Reemplazar en el DOM
          staticItem.replaceWith(dynamicItem.cloneNode(true));

          currentIndex++;
          replaceNextItem();
        }, 150);
      } else {
        // No hay dinámico correspondiente, solo remover el estático
        const staticItem = staticItems[currentIndex];

        // Fade out del elemento estático
        staticItem.style.opacity = "0";
        staticItem.style.transition = "opacity 0.15s ease-out";

        setTimeout(() => {
          // Solo remover el elemento sin reemplazar
          staticItem.remove();

          currentIndex++;
          replaceNextItem();
        }, 150);
      }
    }

    // Iniciar el reemplazo progresivo
    replaceNextItem();
  }

  // Crear un MutationObserver para detectar cuando se añade el dinámico
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        // Verificar si se añadió el elemento dinámico
        const dynamicList = document.getElementById(
          "streaming-platforms-dynamic"
        );

        if (dynamicList) {
          const staticList = document.getElementById(
            "streaming-platforms-static"
          );

          if (staticList) {
            replaceElementsProgressively(staticList, dynamicList);
            // Detener la observación una vez hecho el reemplazo
            observer.disconnect();
          }
        }
      }
    }
  });

  // Iniciar la observación
  observer.observe(container, {
    childList: true,
    subtree: true,
  });

  // Fallback por si el dinámico ya está en el DOM (ej: SSR)
  const dynamicList = document.getElementById("streaming-platforms-dynamic");
  if (dynamicList) {
    const staticList = document.getElementById("streaming-platforms-static");
    if (staticList) {
      replaceElementsProgressively(staticList, dynamicList);
      observer.disconnect();
    }
  }
}

// Ejecutar automáticamente cuando el módulo se cargue
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStreamingPlatformsObserver);
} else {
  initStreamingPlatformsObserver();
}
