export class VxOverlay {
    private static instance?: VxOverlay;
    static getInstance = () => this.instance ?? (this.instance = new VxOverlay());

    show() {}

    destroy() {}
}
