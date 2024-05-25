import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { NodeInterface, LinkInterface } from '../utils/graph'; // Replace with your actual data types

interface ForceDirectedGraphProps {
    data: {
        nodes: NodeInterface[];
        links: LinkInterface[];
    };
}

const ForceDirectedGraph: React.FC<ForceDirectedGraphProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        // Specify the dimensions of the chart.
        const width = 928;
        const height = 600;

        // Specify the color scale.
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.
        const links = data.links.map((d) => ({
            ...d,
            source: d.source.id,
            target: d.target.id,
        }));
        const nodes = data.nodes.map((d) => ({ ...d }));

        // Create a simulation with several forces.
        const simulation = d3
            .forceSimulation(nodes)
            .force(
                'link',
                d3.forceLink(links).id((d: NodeInterface) => d.id)
            )
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(width / 2, height / 2))
            .on('tick', ticked);

        // Create the SVG container.
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height])
            .attr('style', 'max-width: 100%; height: auto;');

        // Add a line for each link, and a circle for each node.
        const link = svg
            .append('g')
            .attr('stroke', '#000')
            .attr('stroke-opacity', 1)
            .selectAll()
            .data(links)
            .join('line')
            .attr('stroke-width', 1)
            .attr('fill', '#000');

        const node = svg
            .append('g')
            .attr('stroke', '#000')
            .attr('stroke-width', 1.5)
            .selectAll()
            .data(nodes)
            .join('circle')
            .attr('r', 5)
            .attr('fill', '#000');

        node.append('title').text((d) => d.id);

        // Add a drag behavior.
        node.call(
            d3
                .drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended)
        );

        // Set the position attributes of links and nodes each time the simulation ticks.
        function ticked() {
            link.attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);

            node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
        }

        // Reheat the simulation when drag starts, and fix the subject position.
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        // Update the subject (dragged node) position during drag.
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        // Restore the target alpha so the simulation cools after dragging ends.
        // Unfix the subject position now that it’s no longer being dragged.
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
    }, [data]);

    return <svg ref={svgRef} />;
};

export default ForceDirectedGraph;
