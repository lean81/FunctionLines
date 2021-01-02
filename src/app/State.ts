import {Injectable, Input} from '@angular/core';
import {Constant} from './Constant';

@Injectable()
export class State {
  @Input()
  public name = 'Første';

  @Input()
  public xEqualsString = 'cos(t / 10) * 500 + a';

  @Input()
  public yEqualsString = 'sin(t / 10) * 500 + 500 + b';

  @Input()
  public tStartString = 0;
  @Input()
  public tEndString = 100;
  @Input()
  public tStepsString = 100;

  public constants: Constant[] = [];
}
