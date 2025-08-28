"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CUSTOMER, PRODUCT, REPORT, SUPPLIER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CircleUserIcon, FileBox, FileSpreadsheet, LogOut, Menu, Package, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '../../../../public/assets';
import { logout } from '@/api/auth';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

export default function Home({ children }: { children: React.ReactNode }) {
    const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const navigation = [
        { name: "Customer", href: CUSTOMER, icon: CircleUserIcon },
        { name: "Supplier", href: SUPPLIER, icon: FileBox },
        { name: "Product", href: PRODUCT, icon: Package },
        { name: "Report", href: REPORT, icon: FileSpreadsheet },
    ];

    const logOutMutation = useMutation({
        mutationFn: logout,
    });

    const handleLogout = async () => {
        const result = await toast.promise(
            logOutMutation.mutateAsync(),
            {
                loading: 'Loging out...',
                success: 'Logout successful!',
                error: 'Logout failed. Please try again.',
            }
        );
        if (!result.message) {
            console.error("Logout failed");
            return;
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
    };

    return (
        <div className="min-h-screen bg-gray-100 font-dmsans">
            <div className="flex h-screen">
                {/* Mobile sidebar */}
                <div
                    className={cn(
                        "fixed inset-0 z-10 transition-transform duration-300 h-screen lg:hidden",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
                    )}
                    onClick={() => setSidebarOpen(false)}
                >
                    <div
                        className="w-64 bg-white h-full shadow-md"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-4 pt-5">
                            <Image
                                width={100}
                                height={100}
                                src={Logo}
                                alt="VUN"
                                className="h-20 w-full object-contain"
                            />
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                                <X className="text-black" />
                            </Button>
                        </div>

                        <nav className="mt-6 px-4 space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "group flex items-center px-4 py-3 rounded-sm text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-primary text-white shadow-sm"
                                                : "hover:text-[#A88058]",
                                        )}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex px-6 space-y-2">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsLoggedOut(true);
                                    setSidebarOpen(false);
                                }}
                                className="w-full justify-start hover:text-[#002D65] mt-2  rounded-[3px]"
                            >
                                <LogOut className="mr-1 h-5 w-5" />
                                Log Out
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Desktop sidebar */}
                <div className="hidden lg:flex lg:flex-shrink-0">
                    <div className="flex flex-col w-64 bg-white">
                        <Image
                            width={100}
                            height={100}
                            src={Logo}
                            alt="VUN"
                            className="h-20 w-full object-contain my-7"
                        />
                        <div className="flex flex-col flex-grow px-4">
                            <nav className="flex-1 space-y-2 mt-2">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "group flex items-center px-4 py-3 text-sm font-medium rounded-sm transition-all duration-200",
                                                isActive
                                                    ? "bg-primary text-white shadow-lg"
                                                    : " hover:text-[#A88058] hover:bg-white/50",
                                            )}
                                        >
                                            <item.icon className="mr-3 h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-auto space-y-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsLoggedOut(true)}
                                    className="w-full justify-start hover:text-[#002D65] rounded-[3px] hover:bg-white/50 mb-6"
                                >
                                    <LogOut className="mr-3 h-5 w-5" />
                                    Log Out
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 w-0 overflow-hidden">
                    <div className="p-3 lg:hidden flex items-center bg-white shadow-md justify-between">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-6 w-6 text-[#002D65]" />
                        </Button>
                        <div className="flex-grow flex justify-center">
                            <Image
                                height={100}
                                width={100}
                                src={Logo}
                                alt="VUN"
                                className="h-10 w-full object-contain"
                            />
                        </div>
                        <div className="w-10" />
                    </div>

                    <main className="relative flex-1 bg-white overflow-y-auto focus:outline-none m-3 md:m-5 rounded-[10px]">
                        <div className="py-3 md:py-6 mx-auto px-3 md:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {/* Logout Confirmation Dialog */}
            <Dialog
                open={isLoggedOut}
                onOpenChange={setIsLoggedOut}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to log out?</DialogTitle>
                        <DialogDescription>
                            You will be logged out of your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 flex-row justify-end">
                        <Button variant="outline" onClick={() => setIsLoggedOut(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            disabled={logOutMutation.isPending || logOutMutation.isSuccess}
                        >
                            {logOutMutation.isPending || logOutMutation.isSuccess ? "Logging out..." : "Log Out"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}