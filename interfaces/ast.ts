export type NodeType = 'Symbol' | 'Concat' | 'Or' | 'Kleene';

export interface Node {
    id: number | null;
    kind: NodeType;
    nullable: boolean;
    firstpos: number[];
    lastpos: number[];
    value: string;
    left: Node | null;
    right: Node | null;
    body: Node | null;
}

export interface Expr extends Node {}

export interface BinaryExpr extends Expr {
    left: Expr | null;
    right: Expr | null;
}

export interface Concat extends BinaryExpr {
    kind: 'Concat';
}

export interface Or extends BinaryExpr {
    kind: 'Or';
}

export interface Kleene extends Node {
    kind: 'Kleene';
    body: Expr | null;
}

export interface Symbol extends Node {
    kind: 'Symbol';
}

export interface FollowPosInterface {
    symbol: string;
    followpos: number[];
    number: number;
}

export interface AbstractSyntaxTreeInterface {
    body: Node;
}
