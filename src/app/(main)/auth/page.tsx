"use client";
import { zodResolver } from '@hookform/resolvers/zod';

import { signIn, verifyToken } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CUSTOMER } from '@/lib/constants';
import { LoginField, loginSchema } from '@/types/auth.types';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Auth: React.FC = () => {
    const router = useRouter();
    const form = useForm<LoginField>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const result = await verifyToken();
                if (result?.token) {
                    localStorage.setItem("token", result.token);
                    localStorage.setItem("user", JSON.stringify(result.user));
                }
                if (result?.user) {
                    router.push("/dashboard/customer-department/customer");
                }
            } catch (err) {
                console.error("Token verification failed", err);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        };
        checkToken();
    }, [router]);

    const loginMutation = useMutation({
        mutationFn: signIn,
    });

    const onSubmit = async () => {
        try {
            const result = await toast.promise(
                loginMutation.mutateAsync(form.getValues()),
                {
                    loading: 'Signing in...',
                    success: 'Login successful!',
                    error: 'Login failed. Please try again.',
                }
            );
            if (result.token) {
                localStorage.setItem("token", result.token);
                localStorage.setItem("user", JSON.stringify(result.user));
                router.push(CUSTOMER);
            } else {
                toast.error("Invalid login response");
            }
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center font-dmsans">
            <div className="flex flex-col items-center justify-center gap-10 ">
                <CardContent className="flex flex-col items-center w-full gap-10 ">
                    <Image
                        width={100}
                        height={100}
                        src="/assets/logo.webp"
                        alt="VUN"
                        className="h-30 items-center justify-center w-full object-contain"
                    />
                    <FormProvider {...form}>
                        <form className="space-y-7">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" placeholder="johndoe@gmail.com" className="w-100" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="password" placeholder="******" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/95 w-full"
                                disabled={loginMutation.isPending || loginMutation.isSuccess}
                                onClick={form.handleSubmit(onSubmit)}
                            >
                                {loginMutation.isPending || loginMutation.isSuccess ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>
                    </FormProvider>
                </CardContent>
            </div>
        </div>
    )
}

export default Auth;
