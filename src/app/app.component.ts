import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Vector2} from 'three';
import {Constant} from './Constant';
import {MatSliderChange} from '@angular/material/slider';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  constructor(private router: Router) {
  }

  @ViewChild('canvas', { static: true })
  public canvas: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasDiv', { static: true })
  public canvasDiv: ElementRef<HTMLElement>;

  private ctx: CanvasRenderingContext2D;

  @Input()
  public name: string;

  @Input()
  public xEqualsString = 'cos(t / 10) * 500 + a';
  @Input()
  public xEqualsConstantReplaced = '';
  @Input()
  public yEqualsString = 'sin(t / 10) * 500 + 500 + b';
  @Input()
  public yEqualsConstantReplaced = '';
  @Input()
  public tStartString = 0;
  @Input()
  public tEndString = 100;
  @Input()
  public tStepsString = 100;

  public constants: Constant[] = [];

  public static replaceAll(input: string, substr: string, newSubstr: string): string{
    return input.split(substr).join(newSubstr);
  }

  public static removeAll(input: string, substr: string): string{
    return AppComponent.replaceAll(input, substr, '');
  }

  static getConstants(formula: string): Set<string> {
    let exprRemoved =  AppComponent.removeAll(formula, 'cos');
    exprRemoved = AppComponent.removeAll(exprRemoved, 'sin');
    return new Set(exprRemoved.replace(/[^a-zA-Z]+/g, ''));
  }

  public draw(): void {
    let constantsChars =  [...new Set(
        [...AppComponent.getConstants(this.xEqualsString),
      ...AppComponent.getConstants(this.yEqualsString)]
    )];

    constantsChars = constantsChars.filter(c => c !== 't');
    constantsChars.sort((one, two) => (one > two ? 1 : -1));
    for (const constant of constantsChars) {
      if (this.constants.find(c => c.name === constant)) {
        continue;
      }
      this.constants.push({name: constant, text: 1, sliderFrom: 0, sliderTo: 100});
    }

    this.setFunctionsWithLettersReplacedWithNumbers();

    // Remove aditional constant items
    this.constants = this.constants.filter(c => constantsChars.find(cc => cc === c.name));
    this.constants.sort((one, two) => (one.name > two.name ? 1 : -1));

    const constantCharsAsString = constantsChars.length === 0 ? '' : ',' + constantsChars.join(',');

    const xReplacedT = ('(t' + constantCharsAsString + ')=>{return ' + this.xEqualsString + '}').replace('sin', 'Math.sin').replace('cos', 'Math.cos');
    // tslint:disable-next-line:no-eval
    const xFunc = eval(xReplacedT);

    const yReplacedT = ('(t' + constantCharsAsString + ')=>{return ' + this.yEqualsString + '}').replace('sin', 'Math.sin').replace('cos', 'Math.cos');
    // tslint:disable-next-line:no-eval
    const yFunc = eval(yReplacedT);

    const tStart = this.tStartString;
    const tEnd = this.tEndString;
    this.tStepsString = Math.min(this.tStepsString, 1000);
    const tSteps = this.tStepsString;
    const allPoints: Vector2[] = [];
    const allConstantValues = this.constants.map(c => c.text);
    for (let i = 0; i < tSteps; i++){
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
    this.ctx.beginPath();
    this.ctx.moveTo(allPoints[0].x, this.ctx.canvas.height - allPoints[0].y);
    for (const p of allPoints) {
      this.ctx.lineTo(p.x,  this.ctx.canvas.height - p.y);
      // this.ctx.lineTo(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
      this.ctx.stroke();
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

  private  getFunctionsWithLettersReplacedWithNumbers(rawFunction: string): string {
    const expressions = ['sin', 'cos'];

    let str = rawFunction;
    for (const expr of expressions) {
      str = AppComponent.replaceAll(str, expr, '#' + expressions.indexOf(expr) + '#');
    }

    for (const constant of this.constants) {
      str = AppComponent.replaceAll(str, constant.name, constant.text.toString());
    }

    for (const expr of expressions) {
      str = AppComponent.replaceAll(str, '#' + expressions.indexOf(expr) + '#', expr);
    }
    return str;
  }

  private setFunctionsWithLettersReplacedWithNumbers(): void {
    this.xEqualsConstantReplaced = this.getFunctionsWithLettersReplacedWithNumbers(this.xEqualsString);
    this.yEqualsConstantReplaced = this.getFunctionsWithLettersReplacedWithNumbers(this.yEqualsString);
  }
}

