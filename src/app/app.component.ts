import {Component, ElementRef, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Vector2} from 'three';
import {Constant} from './Constant';
import {MatSliderChange} from '@angular/material/slider';
import {State} from './State';
import {DOCUMENT} from '@angular/common';

enum Mode {
  normal = 1,
  open = 2
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(@Inject(DOCUMENT) public document: Document, private router: Router) {
  }

  @ViewChild('canvas', {static: false})
  public canvas: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasDiv', {static: false})
  public canvasDiv: ElementRef<HTMLElement>;

  private ctx: CanvasRenderingContext2D;


  @Input()
  public allStates: State[] = [];

  @Input()
  public state: State = new State();
  @Input()
  public xEqualsConstantReplaced = '';
  @Input()
  public yEqualsConstantReplaced = '';

  public Mode = Mode;
  public mode = Mode.normal;

  public static replaceAll(input: string, substr: string, newSubstr: string): string {
    return input.split(substr).join(newSubstr);
  }

  public static removeAll(input: string, substr: string): string {
    return AppComponent.replaceAll(input, substr, '');
  }

  static getConstants(formula: string): Set<string> {
    let exprRemoved = AppComponent.removeAll(formula, 'cos');
    exprRemoved = AppComponent.removeAll(exprRemoved, 'sin');
    return new Set(exprRemoved.replace(/[^a-zA-Z]+/g, ''));
  }

  public draw(): void {
    if (!this.canvas || ! this.canvasDiv) {
      return;
    }

    let constantsChars = [...new Set(
      [...AppComponent.getConstants(this.state.xEqualsString),
        ...AppComponent.getConstants(this.state.yEqualsString)]
    )];

    constantsChars = constantsChars.filter(c => c !== 't');
    constantsChars.sort((one, two) => (one > two ? 1 : -1));
    for (const constant of constantsChars) {
      if (this.state.constants.find(c => c.name === constant)) {
        continue;
      }
      this.state.constants.push({name: constant, text: 1, sliderFrom: 0, sliderTo: 100});
    }

    this.setFunctionsWithLettersReplacedWithNumbers();

    // Remove aditional constant items
    this.state.constants = this.state.constants.filter(c => constantsChars.find(cc => cc === c.name));
    this.state.constants.sort((one, two) => (one.name > two.name ? 1 : -1));

    const constantCharsAsString = constantsChars.length === 0 ? '' : ',' + constantsChars.join(',');

    const xReplacedT = ('(t' + constantCharsAsString + ')=>{return ' + this.state.xEqualsString + '}').replace('sin', 'Math.sin').replace('cos', 'Math.cos');
    // tslint:disable-next-line:no-eval
    const xFunc = eval(xReplacedT);

    const yReplacedT = ('(t' + constantCharsAsString + ')=>{return ' + this.state.yEqualsString + '}').replace('sin', 'Math.sin').replace('cos', 'Math.cos');
    // tslint:disable-next-line:no-eval
    const yFunc = eval(yReplacedT);

    const tStart = this.state.tStartString;
    const tEnd = this.state.tEndString;
    this.state.tStepsString = Math.min(this.state.tStepsString, 1000);
    const tSteps = this.state.tStepsString;
    const allPoints: Vector2[] = [];
    const allConstantValues = this.state.constants.map(c => c.text);
    for (let i = 0; i < tSteps; i++) {
      const t = tStart + (tEnd - tStart) * i;
      const p = new Vector2(xFunc(t, ...allConstantValues), yFunc(t, ...allConstantValues));
      allPoints.push(p);
    }


    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    const minX = Math.min(...allPoints.map(p => p.x));
    const maxX = Math.max(...allPoints.map(p => p.x));

    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 1;

    let prevPoint = allPoints[0];
    for (const p of allPoints) {
      this.ctx.beginPath();
      this.ctx.lineTo(Math.round(prevPoint.x) + 0.5, Math.round(this.ctx.canvas.height - prevPoint.y) + 0.5);
      this.ctx.lineTo(Math.round(p.x) + 0.5, Math.round(this.ctx.canvas.height - p.y) + 0.5);
      this.ctx.stroke();
      prevPoint = p;
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.canvas.nativeElement.width = this.canvasDiv.nativeElement.clientWidth;
      this.canvas.nativeElement.height = this.canvasDiv.nativeElement.clientHeight;
      this.ctx = this.canvas.nativeElement.getContext('2d');
      this.draw();
    });
  }

  public onSliderInputChange($event: MatSliderChange, constant: Constant): void {
    constant.text = $event.value;
    this.draw();
  }

  public goFullscreen(): void {
    const elem = document.documentElement as any;
    const methodToBeInvoked = elem.requestFullscreen ||
      elem.webkitRequestFullScreen || elem.mozRequestFullscreen
      ||
      elem.msRequestFullscreen;
    if (methodToBeInvoked) {
      methodToBeInvoked.call(elem);
    }
  }

  private getFunctionsWithLettersReplacedWithNumbers(rawFunction: string): string {
    const expressions = ['sin', 'cos'];

    let str = rawFunction;
    for (const expr of expressions) {
      str = AppComponent.replaceAll(str, expr, '#' + expressions.indexOf(expr) + '#');
    }

    for (const constant of this.state.constants) {
      str = AppComponent.replaceAll(str, constant.name, constant.text.toString());
    }

    for (const expr of expressions) {
      str = AppComponent.replaceAll(str, '#' + expressions.indexOf(expr) + '#', expr);
    }
    return str;
  }

  private setFunctionsWithLettersReplacedWithNumbers(): void {
    this.xEqualsConstantReplaced = this.getFunctionsWithLettersReplacedWithNumbers(this.state.xEqualsString);
    this.yEqualsConstantReplaced = this.getFunctionsWithLettersReplacedWithNumbers(this.state.yEqualsString);
  }

  public onWindowResize(event: any = null): void {
    if (!this.canvas || ! this.canvasDiv) {
      return;
    }
    this.canvas.nativeElement.width = this.canvasDiv.nativeElement.clientWidth;
    this.canvas.nativeElement.height = this.canvasDiv.nativeElement.clientHeight;
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.draw();
  }

  public saveClicked(): void {
    if (!this.state.name) {
      alert('Der skal skrives et navn');
    }

    this.allStates.push(this.state);
    const stateJson = JSON.stringify(this.allStates);
    localStorage.setItem('allStates', stateJson);
  }

  public openClicked(clickedState: State): void {
      this.state = clickedState;
      this.mode = Mode.normal;
      setTimeout(() => {
        this.onWindowResize();
      });
  }

  public showOpenDialog(): void {
    this.allStates = JSON.parse(localStorage.getItem('allStates')) ?? [];
    if (this.allStates.length === 0) {
      this.allStates.push(new State());
    }
    this.mode = Mode.open;
  }

  public closeOpenDialog(): void {
    this.mode = Mode.normal;
    setTimeout(() => {
      this.onWindowResize();
    });
  }
}

