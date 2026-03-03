class Node{
    constructor(x,y){this.x=x;this.y=y;this.parent=null;this.f=0;this.g=0;this.h=0;}
    equals(other){return this.x===other.x && this.y===other.y;}
}