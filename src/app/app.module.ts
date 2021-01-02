import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ShowCardComponent } from './show-card/show-card.component';
import {RouterModule, Routes} from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {MatSliderModule} from '@angular/material/slider';
import {BackButtonDisableModule} from 'angular-disable-browser-back-button';
import {MatCardModule} from '@angular/material/card';

const appRoutes: Routes = [
  { path: 'showCard', component: ShowCardComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    ShowCardComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    // NgbModule.forRoot(),
    NgbModule,
    FormsModule,
    MatSliderModule,
    MatCardModule,
    BackButtonDisableModule.forRoot()
  ],
  exports: [ RouterModule ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
