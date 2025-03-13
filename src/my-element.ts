import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import './treemap-crypto.ts';
@customElement('my-element')
export class MyElement extends LitElement {
  render() {
    return html`
      <h1>TreeMap</h1>
      <treemap-crypto></treemap-crypto>
    `;
  }
}
