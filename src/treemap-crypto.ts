import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as d3 from 'd3';

// Тип для одного объекта категории
interface ICoinCategory {
    id: string;
    name: string;
    market_cap: number;
    market_cap_change_24h: number;
    content: string;
    top_3_coins: string[];
    volume_24h: number;
    updated_at: string;
}

// Корневой тип для Treemap
interface ITreeData {
    name: string;
    children: ICoinCategory[];
}

@customElement('treemap-crypto')
export class TreemapCrypto extends LitElement {
    static styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: 600px;
    }

    svg {
      width: 100%;
      height: 100%;
      font-family: sans-serif;
    }

    .tooltip {
      position: absolute;
      pointer-events: none;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px;
      display: none;
    }

    .tooltip img {
      width: 32px;
      height: 32px;
      margin: 2px;
    }

    text {
        pointer-events: none;
        fill: #fff
    }
  `;

    @property({ type: String }) apiKey: string = 'CG-b3XBe7SmsR5ZENqX8B7Ccf2z';

    @state() private categories: ICoinCategory[] = [];

    private tooltipEl!: HTMLDivElement;

    firstUpdated(_changedProperties: PropertyValues) {
        super.firstUpdated(_changedProperties);

        this.tooltipEl = document.createElement('div');
        this.tooltipEl.className = 'tooltip';
        this.shadowRoot?.appendChild(this.tooltipEl);

        this.fetchCategoriesData().then(() => {
            this.renderTreemap();
        });
    }

    private async fetchCategoriesData() {
        const url = `https://api.coingecko.com/api/v3/coins/categories`;
        const options = {
            method: 'GET',
            headers: { accept: 'application/json', 'x-cg-demo-api-key': 'CG-b3XBe7SmsR5ZENqX8B7Ccf2z' }
        };
        const response = await fetch(url, options);
        const data = await response.json();
        this.categories = data;
    }

    private renderTreemap() {
        const container = this.renderRoot.querySelector('.chart-container');
        if (!container) return;

        container.innerHTML = '';

        const width = container.clientWidth;
        const height = container.clientHeight;

        const svg = d3
            .select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const rootData: ITreeData = {
            name: 'categories',
            children: this.categories,
        };

        const root = d3
            .hierarchy<ICoinCategory | ITreeData>(rootData)
            .sum((d) => 'market_cap' in d ? d.market_cap : 0);

        d3
            .treemap<ICoinCategory>()
            .size([width, height])
            .padding(2)(root as d3.HierarchyNode<ICoinCategory>);

        const nodes = svg
            .selectAll('g')
            .data(root.leaves())
            .enter()
            .append('g')
            .attr('transform', (d) => `translate(${(d as d3.HierarchyRectangularNode<ICoinCategory | ITreeData>).x0},${(d as d3.HierarchyRectangularNode<ICoinCategory | ITreeData>).y0})`);

        nodes
            .append('rect')
            .attr('width', (d) => (d as d3.HierarchyRectangularNode<ICoinCategory | ITreeData>).x1 - (d as d3.HierarchyRectangularNode<ICoinCategory | ITreeData>).x0)
            .attr('height', (d) => (d as d3.HierarchyRectangularNode<ICoinCategory | ITreeData>).y1 - (d as d3.HierarchyRectangularNode<ICoinCategory | ITreeData>).y0)
            .style('fill', (d: d3.HierarchyNode<ICoinCategory | ITreeData>) => {
                if ('market_cap_change_24h' in d.data) {
                    const change = d.data.market_cap_change_24h;
                    return change >= 0 ? 'green' : 'red';
                }
                return 'gray';
            })
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                if ('top_3_coins' in d.data) {
                    this.showTooltip(event, d.data.top_3_coins);
                }
            })
            .on('mousemove', (event, d) => {
                this.moveTooltip(event);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            });



        nodes
            .append('text')
            .attr('x', 4)
            .attr('y', 16)
            .text((d) => d.data.name)
            .style('font-size', '12px')

        nodes
            .append('text')
            .attr('x', 4)
            .attr('y', 32)
            .text((d) => (d.data as ICoinCategory).market_cap_change_24h.toFixed(2))
            .style('font-size', '12px')
    }

    private showTooltip(event: MouseEvent, top3Coins: string[]) {
        let content = '';
        top3Coins.forEach((coinUrl) => {
            content += `<img src="${coinUrl}" alt="coin" />`;
        });

        this.tooltipEl.innerHTML = content;
        this.tooltipEl.style.display = 'block';
        this.moveTooltip(event);
    }

    private moveTooltip(event: MouseEvent) {
        const offset = 10;
        this.tooltipEl.style.left = event.offsetX + offset + 'px';
        this.tooltipEl.style.top = event.offsetY + offset + 'px';
    }

    private hideTooltip() {
        this.tooltipEl.style.display = 'none';
    }

    render() {
        return html`
      <div class="chart-container"></div>
    `;
    }
}
