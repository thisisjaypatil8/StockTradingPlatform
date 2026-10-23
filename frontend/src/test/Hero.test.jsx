import { render, screen } from '@testing-library/react'
import Hero from '../landing_page/home/Hero'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'

describe("Hero Component", () => {
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
    });

    test("renders 'signup for free' button and hides 'Go to Dashboard' when not logged in", () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <Hero />
                </AuthProvider>
            </BrowserRouter>
        );

        const signupBtn = screen.getByRole("link", {name: /sign up for free/i});
        expect(signupBtn).toBeInTheDocument();
        expect(signupBtn).toHaveAttribute("href", "/signup");
 
        // Ensure protected dashboard navigation link is unmounted for unauthenticated sessions
        const dashboardBtn = screen.queryByRole('link', {name: /go to dashboard/i});
        expect(dashboardBtn).not.toBeInTheDocument();
    });
});