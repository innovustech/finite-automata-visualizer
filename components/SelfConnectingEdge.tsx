import React from 'react';
import { BaseEdge, BezierEdge, EdgeLabelRenderer, EdgeProps } from 'reactflow';
import FloatingEdge from './FloatingEdge';

export default function SelfConnecting(props: EdgeProps) {
    if (props.source !== props.target) {
        return <FloatingEdge {...props} />;
    }

    const { sourceX, sourceY, targetX, targetY, id, markerEnd, label } = props;
    const radiusX = (sourceX - targetX) * 0.6;
    const radiusY = 50;
    const edgePath = `M ${sourceX} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX} ${targetY}`;

    return (
        <>
            <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
            <EdgeLabelRenderer>
                <p
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px,${sourceY + 75}px)`,
                        backgroundColor: '#8f94a1',
                        padding: '5px 6px',
                        borderRadius: '50%',
                    }}
                    className="nodrag nopan"
                >
                    {label}
                </p>
            </EdgeLabelRenderer>
        </>
    );
}