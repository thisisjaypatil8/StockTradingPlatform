import { render, screen } from '@testing-library/react'
import Hero from '../landing_page/home/Hero'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'

describe("Hero Component", () => {
    // Test 1: image render
    test("renders hero image", () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <Hero />
                </AuthProvider>
            </BrowserRouter>
        );
        const heroImage = screen.getByAltText('homeHero');
        expect(heroImage).toBeInTheDocument();
        expect(heroImage).toHaveAttribute("src", "/media/images/homeHero.svg");
    });

    // Test 2: Main Heading
    test("renders main heading", () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <Hero />
                </AuthProvider>
            </BrowserRouter>
        );
        const heading = screen.getByRole('heading', {name: /invest in everything/i, level:1});
        expect(heading).toBeInTheDocument();
    })

    // Test 3: Logged-out state buttons
    test("renders 'signup for free' button and hides 'Go to Dashboard' when not logged in", () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <Hero />
                </AuthProvider>
            </BrowserRouter>
        )
        // Sign up button must exist with correct href
        const signupBtn = screen.getByRole("link", {name: /sign up for free/i});
        expect(signupBtn).toBeInTheDocument();
        expect(signupBtn).toHaveAttribute("href", "/signup");
 
        // Dashboard button must not exist (queryByRole returns null instead of error)
        const dashboardBtn = screen.queryByRole('link', {name: /go to dashboard/i});
        expect(dashboardBtn).not.toBeInTheDocument();
    });
    
})