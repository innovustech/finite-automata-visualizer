import { NodeInterface, LinkInterface } from '../interfaces/graph';
import { FollowPosInterface } from '../interfaces/ast';
import { FinalState } from '../constants/stateTypes';

export const findNodeByTargetValues = (
    target: number[],
    nodes: NodeInterface[]
): NodeInterface => {
    for (const node of nodes) {
        const nodeSet = new Set(node.values);
        if (target.every((val) => nodeSet.has(val))) {
            return node;
        }
    }

    return null;
};

export const getNewNodes = (
    currentNode: NodeInterface,
    followpos: FollowPosInterface[]
) => {
    let a = [];
    let b = [];

    currentNode.values.forEach((value) => {
        if (followpos[value - 1].symbol === 'a') {
            if (a.length == 0) {
                a = followpos[value - 1].followpos;
            } else {
                a = [...a, ...followpos[value - 1].followpos];
            }
            a = a.filter((item, index, self) => {
                return self.indexOf(item) === index;
            });
        } else if (followpos[value - 1].symbol === 'b') {
            if (b.length == 0) {
                b = followpos[value - 1].followpos;
            } else {
                b = [...b, ...followpos[value - 1].followpos];
            }
            b = b.filter((item, index, self) => {
                return self.indexOf(item) === index;
            });
        }
    });

    a.sort();
    b.sort();

    return { a, b };
};

export const isArrayPresent = (
    target: number[],
    base: NodeInterface[]
): boolean => {
    const stringifiedTarget = JSON.stringify(target.sort());
    return base.some((node) => {
        const stringifiedValues = JSON.stringify(node.values.sort());
        return stringifiedValues === stringifiedTarget;
    });
};

export const generateLink = (
    source: NodeInterface,
    target: NodeInterface,
    transition: string
) => {
    return { source, target, transition };
};

export const generateNode = (
    id: number,
    values: number[],
    group: number,
    finalState: number
) => {
    return { id, values, group, isFinalState: values.includes(finalState) };
};

export const getNewValues = (
    potentialList: number[],
    followpos: FollowPosInterface[]
) => {
    let newValues = [];

    potentialList.forEach((id) => {
        const matchedFollowPos = followpos.find((value) => {
            return id === value.number;
        });

        if (matchedFollowPos) {
            newValues.push(...matchedFollowPos.followpos);
        }
    });

    return newValues.filter((item, index) => {
        return newValues.indexOf(item) === index;
    });
};

const checkDuplicateLink = (
    links: LinkInterface[],
    source: NodeInterface,
    target: NodeInterface
) => {
    const sourceId = source.id;
    const targetId = target.id;

    const duplicates = links.map((link, index) => {
        const existingSourceId = link.source.id;
        const existingTargetId = link.target.id;
        if (sourceId === existingSourceId && targetId === existingTargetId) {
            return index;
        } else {
            return;
        }
    });

    const filteredDuplicates = duplicates.filter(
        (element) => element !== undefined
    );

    if (filteredDuplicates.length === 0) {
        return null;
    } else {
        return filteredDuplicates;
    }
};

export const generateNodesAndLinks = (
    firstpos: number[],
    followpos: FollowPosInterface[]
) => {
    const finalState = followpos.find((data) => {
        return data.symbol === '#';
    }).number;

    let nodes: NodeInterface[] = [
        { id: 1, values: firstpos, group: 1, isFinalState: false },
    ];

    if (nodes[0].values.includes(finalState)) {
        nodes[0].isFinalState = true;
    }

    let links: LinkInterface[] = [];
    let queue: NodeInterface[] = [...nodes];

    let deadState = null;

    let nodeCount = 2;

    const generateDeadState = () => {
        const deadStateId = -1;
        const newDeadState = generateNode(deadStateId, [], 1, finalState);
        deadState = newDeadState;
        nodes.push(deadState);
        const dead = generateLink(deadState, deadState, 'a,b');
        links.push(dead);
    };

    while (queue.length > 0) {
        const currentNode = queue.shift();

        const currentSymbol = followpos[currentNode.id - 1].symbol;

        const { a, b } = getNewNodes(currentNode, followpos);

        const potentialNewNodes = [];

        if (a.length !== 0) {
            potentialNewNodes.push({
                transition: 'a',
                list: a,
            });
        } else if (currentSymbol !== '#') {
            if (deadState === null) {
                generateDeadState();
            }
            const newLink = generateLink(currentNode, deadState, 'a');
            links.push(newLink);
        }

        if (b.length !== 0) {
            potentialNewNodes.push({
                transition: 'b',
                list: b,
            });
        } else if (currentSymbol !== '#') {
            if (deadState === null) {
                generateDeadState();
            }
            const newLink = generateLink(currentNode, deadState, 'b');
            links.push(newLink);
        }

        potentialNewNodes.forEach((potential) => {
            if (isArrayPresent(potential.list, nodes)) {
                const targetNode = findNodeByTargetValues(
                    potential.list,
                    nodes
                );

                const duplicates = checkDuplicateLink(
                    links,
                    currentNode,
                    targetNode
                );

                if (duplicates !== null) {
                    duplicates.forEach((duplicateIndex) => {
                        const newTransition = `${potential.transition},${links[duplicateIndex].transition}`;
                        links[duplicateIndex].transition = newTransition;
                    });
                } else {
                    const newLink = generateLink(
                        currentNode,
                        targetNode,
                        potential.transition
                    );
                    links.push(newLink);
                }
            } else {
                const newNode = generateNode(
                    nodeCount,
                    potential.list,
                    1,
                    finalState
                );

                nodeCount += 1;
                nodes.push(newNode);
                queue.push(newNode);

                const duplicates = checkDuplicateLink(
                    links,
                    currentNode,
                    newNode
                );

                if (duplicates !== null) {
                    duplicates.forEach((duplicateIndex) => {
                        const newTransition = `${potential.transition},${links[duplicateIndex].transition}`;
                        links[duplicateIndex].transition = newTransition;
                    });
                } else {
                    const newLink = generateLink(
                        currentNode,
                        newNode,
                        potential.transition
                    );
                    links.push(newLink);
                }
            }
        });
    }

    // Find final state

    let finalStateNode = {} as NodeInterface;

    nodes.forEach((node) => {
        if (node.isFinalState) {
            finalStateNode = node;
        }
    });

    let finalEdgesState = FinalState.NONE as FinalState;

    links.forEach((link) => {
        if (link.source === finalStateNode) {
            if (link.transition === 'a') {
                if (finalEdgesState === FinalState.B) {
                    finalEdgesState = FinalState.AB;
                    return;
                }
                finalEdgesState = FinalState.A;
            } else if (link.transition === 'b') {
                if (finalEdgesState === FinalState.A) {
                    finalEdgesState = FinalState.AB;
                }
                finalEdgesState = FinalState.B;
            }
        }
    });

    if (finalEdgesState !== FinalState.AB) {
        if (deadState === null) {
            generateDeadState();
        }
    }

    let newLink = {} as LinkInterface;

    if (finalEdgesState === FinalState.A) {
        newLink = generateLink(finalStateNode, deadState, FinalState.B);
    } else if (finalEdgesState === FinalState.B) {
        newLink = generateLink(finalStateNode, deadState, FinalState.A);
    } else if (finalEdgesState === FinalState.NONE) {
        newLink = generateLink(finalStateNode, deadState, FinalState.AB);
    }

    links.push(newLink);

    return { nodes, links };
};
