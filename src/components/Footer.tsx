import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-secondary/50">
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tighter">HairLine</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Точность в каждой линии. Премиальная сеть салонов для тех, кто ценит качество.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Навигация</h4>
          <div className="mt-3 flex flex-col gap-2">
            <Link to="/masters" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Мастера</Link>
            <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Магазин</Link>
            <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Профиль</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Локации</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <span>ул. Центральная, 15</span>
            <span>пр. Северный, 42</span>
            <span>ул. Южная, 8</span>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Контакты</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <span>+7 (999) 123-45-67</span>
            <span>info@hairline.ru</span>
          </div>
        </div>
      </div>
      <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 HairLine. Все права защищены.
      </div>
    </div>
  </footer>
);

export default Footer;
