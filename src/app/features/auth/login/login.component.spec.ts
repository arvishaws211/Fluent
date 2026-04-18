import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      loginWithGoogle: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should validate email format', () => {
    const email = component.loginForm.controls.email;
    email.setValue('invalid-email');
    expect(email.errors?.['email']).toBeTruthy();
    
    email.setValue('test@example.com');
    expect(email.errors).toBeNull();
  });

  it('should submit form and navigate on success', fakeAsync(() => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    authServiceMock.login.mockResolvedValue({});
    
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    tick();
    
    expect(authServiceMock.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should show error message on login failure', fakeAsync(() => {
    authServiceMock.login.mockRejectedValue(new Error('Auth failed'));
    
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    tick();
    
    expect(component.errorMessage).toBe('Auth failed');
  }));

  it('should handle Google login', fakeAsync(() => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    authServiceMock.loginWithGoogle.mockResolvedValue({});
    
    component.onGoogleLogin();
    tick();
    
    expect(authServiceMock.loginWithGoogle).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  }));
});
