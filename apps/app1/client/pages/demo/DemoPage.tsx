import { Header } from "../../components/header/Header";
import { useEffect, useState } from "react";
import { DemoDTO } from "../../shared/modules/demo/demo.entity";
import { demoApi } from "../../api/instance";
import { Locale } from "../../methods/locale";

const DemoPage = () => {
    const [DemoList, setDemoList] = useState<DemoDTO[]>([]);

    useEffect(() => {
        (async () => {
            const token = localStorage.getItem("access_token");
            const { success, data } = await demoApi.list({ page: 1, auth: token || undefined });
            if (success && data) {
                setDemoList(data.list);
            }
        })();
    }, []);

    return (
        <div className="max-w-screen">
            <Header name={Locale("Menu").Demo} />
            <div className="p-4">{JSON.stringify(DemoList)}</div>
        </div>
    );
};

export default DemoPage;
