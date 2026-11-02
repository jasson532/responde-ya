import type { AccordionData } from 'modules/dynamic-content/types/blocks.types';
import './AccordionBlock.scss';

/**
 * Preguntas plegables.
 *
 * Usa `<details>` y `<summary>` nativos en lugar de estado de React: el
 * navegador ya resuelve el plegado, el teclado y el anuncio del estado
 * expandido a los lectores de pantalla. Reimplementarlo con un botón y un
 * `aria-expanded` sería más código para conseguir lo mismo, y peor.
 *
 * Sin atributo `name`, así que varias pueden estar abiertas a la vez: al
 * comparar dos respuestas, cerrar una para abrir la otra estorba.
 */
const AccordionBlock = ({ title, items }: AccordionData) => (
  <section className="accordion" data-testid="AccordionBlock">
    {title && <h3 className="accordion__title">{title}</h3>}

    <div className="accordion__list">
      {items.map((item) => (
        <details key={item.id} className="accordion__item">
          <summary className="accordion__question">{item.question}</summary>
          <p className="accordion__answer">{item.answer}</p>
        </details>
      ))}
    </div>
  </section>
);

export default AccordionBlock;
