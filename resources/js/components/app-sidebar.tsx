import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Building2, CalendarRange, Layers3, LayoutGrid, Map, ReceiptText, ShieldCheck, Users } from 'lucide-react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import ReportsController from '@/actions/App/Http/Controllers/ReportsController';
import RegistrationVerificationController from '@/actions/App/Http/Controllers/RegistrationVerificationController';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...(auth.can.manageOnlineRegistrations
            ? [
                  {
                      title: 'Online Registration',
                      href: OnlineRegistrationController.index(),
                      icon: ReceiptText,
                  },
              ]
            : []),
        ...(auth.can.manageOnsiteRegistrations
            ? [
                  {
                      title: 'Onsite Registration',
                      href: OnsiteRegistrationController.index(),
                      icon: ReceiptText,
                  },
              ]
            : []),
        ...(auth.can.reviewOnlineRegistrations
            ? [
                  {
                      title: 'Verification',
                      href: RegistrationVerificationController.index(),
                      icon: ShieldCheck,
                  },
              ]
            : []),
        ...(auth.can.viewReports
            ? [
                  {
                      title: 'Reports',
                      href: ReportsController(),
                      icon: BarChart3,
                  },
              ]
            : []),
        ...(auth.can.manageUsers
            ? [
                  {
                      title: 'Users',
                      href: UserController.index(),
                      icon: Users,
                  },
              ]
            : []),
        ...(auth.can.manageEvents
            ? [
                  {
                      title: 'Events',
                      href: EventController.index(),
                      icon: CalendarRange,
                  },
              ]
            : []),
        ...(auth.can.manageMasterData
            ? [
                  {
                      title: 'Districts',
                      href: DistrictController.index(),
                      icon: Map,
                  },
                  {
                      title: 'Sections',
                      href: SectionController.index(),
                      icon: Layers3,
                  },
                  {
                      title: 'Pastors',
                      href: PastorController.index(),
                      icon: Building2,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
