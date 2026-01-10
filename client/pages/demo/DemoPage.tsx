import { Header } from "../../components/header/Header";
import { useEffect, useState } from "react";
import { DemoImpl } from "../../../shared/dto/demo";
import { DemoRouter } from "../../api/instance";
import { Locale } from "../../methods/locale";

const DemoPage = () => {
    const [DemoList, setDemoList] = useState<Array<DemoImpl>>([]);

    useEffect(() => {
        (async () => {
            const { success, data } = await DemoRouter.queryDemo({ name: "" });
            const { list } = data;
            setDemoList(list);
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
