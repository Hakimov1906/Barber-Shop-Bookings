import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isLogin ? "Вход в аккаунт" : "Регистрация"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? "Войдите, чтобы управлять записями"
              : "Создайте аккаунт для записи к мастерам"}
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Имя"
                className="w-full rounded-lg border-0 bg-secondary py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground transition-shadow"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border-0 bg-secondary py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground transition-shadow"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              placeholder="Пароль"
              className="w-full rounded-lg border-0 bg-secondary py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground transition-shadow"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            {isLogin ? "Войти" : "Создать аккаунт"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
